/**
 * translate(text, target) - uses LibreTranslate public instance by default.
 * NOTE: For heavy use, self-host or provide Google Translate API key.
 */
export async function translate(text, target='hi') {
  if(!text) return text;
  try {
    const res = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source: 'en', target, format: 'text' })
    });
    if(!res.ok) return text;
    const data = await res.json();
    return data.translatedText || text;
  } catch(e) {
    console.error('Translate error', e);
    return text;
  }
}
