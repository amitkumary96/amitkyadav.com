/**
 * Devanagari to Roman, tuned for Hindi rather than Sanskrit.
 *
 * Why this is hand-written instead of pulling a library: the mature options
 * (sanscript and friends) target Sanskrit and produce scholarly romanisations —
 * "नहीं" becomes "nahīṃ". A Hindi reader who cannot read Devanagari wants
 * "nahin". Two differences drive that:
 *
 *   1. Schwa deletion. Devanagari consonants carry an inherent 'a'. Sanskrit
 *      keeps it, so "मन" transliterates as "mana"; Hindi drops it word-finally,
 *      giving "man".
 *   2. Anusvara. IAST renders ं as ṃ; Hindi convention is 'n', or 'm' before a
 *      labial — "संभव" is "sambhav", not "sanbhav".
 *
 * This is deliberately approximate and labelled as such in the interface. Schwa
 * deletion in medial positions depends on morphology no rule set can settle, so
 * "कमल" comes out "kamal" (right) while some words will read slightly off. It is
 * a reading aid, not a transcription — where it matters, write the romanisation
 * by hand in the post.
 */

/** Consonants, without their inherent vowel. */
const CONSONANTS: Record<string, string> = {
  क: 'k', ख: 'kh', ग: 'g', घ: 'gh', ङ: 'ng',
  च: 'ch', छ: 'chh', ज: 'j', झ: 'jh', ञ: 'ny',
  ट: 't', ठ: 'th', ड: 'd', ढ: 'dh', ण: 'n',
  त: 't', थ: 'th', द: 'd', ध: 'dh', न: 'n',
  प: 'p', फ: 'ph', ब: 'b', भ: 'bh', म: 'm',
  य: 'y', र: 'r', ल: 'l', व: 'v', ळ: 'l',
  श: 'sh', ष: 'sh', स: 's', ह: 'h',
  // Precomposed nukta forms, mostly Perso-Arabic loans.
  क़: 'q', ख़: 'kh', ग़: 'g', ज़: 'z', झ़: 'zh',
  ड़: 'r', ढ़: 'rh', फ़: 'f', य़: 'y',
};

/**
 * Vowels, collapsed to their short Roman forms.
 *
 * Length is deliberately not marked. Writing it out gave "kavitaa", "kahaanee"
 * and "naheen" — nobody types those. Hinglish convention writes a single letter
 * and lets context carry the length, so "kavita", "kahani", "nahin". The cost is
 * that "रात" comes out "rat" rather than "raat"; the gain is that the large
 * majority of words look the way a Hindi speaker would actually write them.
 */
const VOWELS: Record<string, string> = {
  अ: 'a', आ: 'a', इ: 'i', ई: 'i', उ: 'u', ऊ: 'u',
  ऋ: 'ri', ए: 'e', ऐ: 'ai', ओ: 'o', औ: 'au',
  ऍ: 'e', ऑ: 'o', ऎ: 'e', ऒ: 'o',
};

/** Vowel signs, which attach to the preceding consonant. */
const MATRAS: Record<string, string> = {
  'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u',
  'ृ': 'ri', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
  'ॅ': 'e', 'ॉ': 'o', 'ॆ': 'e', 'ॊ': 'o',
};

const DIGITS: Record<string, string> = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
};

const VIRAMA = '्';
const NUKTA = '़';
const ANUSVARA = 'ं';
const CHANDRABINDU = 'ँ';
const VISARGA = 'ः';

/** Nukta applied as a combining mark rather than a precomposed character. */
const NUKTA_SHIFT: Record<string, string> = {
  क: 'q', ख: 'kh', ग: 'g', ज: 'z', ड: 'r', ढ: 'rh', फ: 'f',
};

/** Labials, before which anusvara is conventionally written 'm'. */
const LABIALS = new Set(['p', 'ph', 'b', 'bh', 'm', 'f']);

const isDevanagari = (char: string) => /[ऀ-ॿ]/.test(char);

interface Unit {
  /** Consonant cluster or vowel already rendered in Roman. */
  roman: string;
  /** True when an inherent 'a' is still pending on a consonant. */
  inherent: boolean;
  /** Nasal to append once the following sound is known. */
  nasal?: boolean;
}

export function devanagariToRoman(input: string): string {
  const out: string[] = [];
  const units: Unit[] = [];

  const flush = () => {
    for (let i = 0; i < units.length; i += 1) {
      const unit = units[i];
      let text = unit.roman;

      if (unit.inherent) {
        const isLast = i === units.length - 1;
        /**
         * Drop the inherent vowel word-finally — the single rule that separates
         * readable Hindi from Sanskrit transliteration. Kept elsewhere, since
         * dropping it medially needs morphology.
         */
        if (!isLast) text += 'a';
      }

      if (unit.nasal) {
        const next = units[i + 1]?.roman ?? '';
        if (LABIALS.has(next)) {
          // Anusvara assimilates to the following labial: संभव -> sambhav.
          text += 'm';
        } else if (text.endsWith('e')) {
          // Nasalised ए is written "ein" by convention: में -> mein.
          text += 'in';
        } else {
          text += 'n';
        }
      }

      out.push(text);
    }
    units.length = 0;
  };

  const chars = [...input];

  for (let i = 0; i < chars.length; i += 1) {
    const char = chars[i];

    if (!isDevanagari(char)) {
      flush();
      out.push(char);
      continue;
    }

    if (DIGITS[char]) {
      flush();
      out.push(DIGITS[char]);
      continue;
    }

    // Danda and double danda read as sentence punctuation.
    if (char === '।' || char === '॥') {
      flush();
      out.push('.');
      continue;
    }

    if (VOWELS[char]) {
      units.push({ roman: VOWELS[char], inherent: false });
      continue;
    }

    if (CONSONANTS[char]) {
      let roman = CONSONANTS[char];

      // A following nukta changes the consonant rather than adding a sound.
      if (chars[i + 1] === NUKTA) {
        roman = NUKTA_SHIFT[char] ?? roman;
        i += 1;
      }

      units.push({ roman, inherent: true });
      continue;
    }

    const current = units[units.length - 1];

    if (MATRAS[char] && current) {
      current.roman += MATRAS[char];
      current.inherent = false;
      continue;
    }

    if (char === VIRAMA && current) {
      // Virama suppresses the inherent vowel, forming a cluster.
      current.inherent = false;
      continue;
    }

    if ((char === ANUSVARA || char === CHANDRABINDU) && current) {
      current.nasal = true;
      continue;
    }

    if (char === VISARGA && current) {
      current.roman += 'h';
      current.inherent = false;
      continue;
    }

    // Anything unmapped (rare signs, ZWJ) is dropped rather than guessed at.
  }

  flush();
  return out.join('');
}

/** True when the text contains any Devanagari worth converting. */
export function hasDevanagari(input: string): boolean {
  return /[ऀ-ॿ]/.test(input);
}
