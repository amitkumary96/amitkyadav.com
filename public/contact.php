<?php
/**
 * Contact form endpoint.
 *
 * The form previously composed a mailto: link, which asked the visitor to finish
 * the job in their own mail client — a good share of people on phones abandon
 * that. Hostinger runs PHP, so the site can have a real endpoint with no
 * third-party form service and no API key.
 *
 * Deployed as part of the static bundle (public/ is copied verbatim), so it
 * lives beside the built HTML at /contact.php.
 *
 * Note for any future host move: this is the one server-dependent file in the
 * project. On a purely static host it would 404 and the form would need a
 * different endpoint.
 */

declare(strict_types=1);

const RECIPIENT   = 'amitkumary96@gmail.com';
const RETURN_PATH = '/contact/';
const MIN_SECONDS = 3;      // Faster than this is a bot, not a person.
const MAX_SECONDS = 86400;  // A day-old form token is stale.
const MAX_MESSAGE = 5000;

/** Send the visitor back to the form with a status, never rendering HTML here. */
function finish(string $status): void
{
    header('Location: ' . RETURN_PATH . '?status=' . urlencode($status), true, 303);
    exit;
}

/**
 * Strip anything that could break out of a mail header into a new one. Header
 * injection is the classic vulnerability in a hand-rolled contact form, so no
 * user-supplied value reaches a header without passing through here.
 */
function headerSafe(string $value): string
{
    return trim(str_replace(["\r", "\n", "\0", '%0a', '%0d'], '', $value));
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    finish('method');
}

// A field hidden from people and irresistible to naive bots.
if (trim((string) ($_POST['website'] ?? '')) !== '') {
    // Answer as though it worked, so the bot has nothing to learn.
    finish('sent');
}

/**
 * Round-trip timing: too fast means scripted, too old means the page sat open for
 * a day. The field is stamped by JavaScript when the page loads, so an empty
 * value means a visitor without JavaScript — checked rather than rejected, since
 * refusing them would be worse than the spam it prevents. The honeypot still
 * applies either way.
 */
$startedRaw = trim((string) ($_POST['started'] ?? ''));
if ($startedRaw !== '') {
    $elapsed = time() - (int) $startedRaw;
    if ($elapsed < MIN_SECONDS || $elapsed > MAX_SECONDS) {
        finish('timing');
    }
}

$name    = headerSafe((string) ($_POST['name'] ?? ''));
$email   = headerSafe((string) ($_POST['email'] ?? ''));
$subject = headerSafe((string) ($_POST['subject'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));

if ($name === '' || $email === '' || $message === '') {
    finish('incomplete');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    finish('email');
}

if (mb_strlen($message) > MAX_MESSAGE) {
    finish('long');
}

if ($subject === '') {
    $subject = 'Message from amitkyadav.com';
}

$body = implode("\n", [
    'Name:  ' . $name,
    'Email: ' . $email,
    '',
    $message,
    '',
    '---',
    'Sent from the contact form at amitkyadav.com',
    'IP: ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'),
]);

/**
 * From must be a mailbox on this domain or the host will refuse to relay it;
 * Reply-To carries the visitor's address so replying reaches them.
 */
$headers = implode("\r\n", [
    'From: amitkyadav.com <no-reply@amitkyadav.com>',
    'Reply-To: ' . $name . ' <' . $email . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion(),
]);

$sent = mail(
    RECIPIENT,
    '[amitkyadav.com] ' . $subject,
    $body,
    $headers,
    '-fno-reply@amitkyadav.com'
);

finish($sent ? 'sent' : 'failed');
