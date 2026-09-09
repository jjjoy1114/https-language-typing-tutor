/**
 * Hangul Jamo Decomposition Utility for precise typing matching.
 */

const HANGUL_BASE = 0xAC00;
const HANGUL_END = 0xD7A3;

const CHOSEONG_LIST = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

const JUNGSEONG_LIST = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
];

const JONGSEONG_LIST = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

// Split double final consonants (Jongseong) into basic components
const JONGSEONG_SPLIT: Record<string, string[]> = {
  'ㄳ': ['ㄱ', 'ㅅ'],
  'ㄵ': ['ㄴ', 'ㅈ'],
  'ㄶ': ['ㄴ', 'ㅎ'],
  'ㄺ': ['ㄹ', 'ㄱ'],
  'ㄻ': ['ㄹ', 'ㅁ'],
  'ㄼ': ['ㄹ', 'ㅂ'],
  'ㄽ': ['ㄹ', 'ㅅ'],
  'ㄾ': ['ㄹ', 'ㅌ'],
  'ㄿ': ['ㄹ', 'ㅍ'],
  'ㅀ': ['ㄹ', 'ㅎ'],
  'ㅄ': ['ㅂ', 'ㅅ'],
  'ㄲ': ['ㄱ', 'ㄱ'],
  'ㅆ': ['ㅅ', 'ㅅ']
};

// Split compound vowels (Jungseong) into basic components
const JUNGSEONG_SPLIT: Record<string, string[]> = {
  'ㅘ': ['ㅗ', 'ㅏ'],
  'ㅙ': ['ㅗ', 'ㅐ'],
  'ㅚ': ['ㅗ', 'ㅣ'],
  'ㅝ': ['ㅜ', 'ㅓ'],
  'ㅞ': ['ㅜ', 'ㅔ'],
  'ㅟ': ['ㅜ', 'ㅣ'],
  'ㅢ': ['ㅡ', 'ㅣ'],
  'ㅒ': ['ㅑ', 'ㅣ'],
  'ㅖ': ['ㅕ', 'ㅣ']
};

/**
 * Checks if a character is a Hangul syllable or Jamo.
 */
export function isHangul(char: string): boolean {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return (
    (code >= HANGUL_BASE && code <= HANGUL_END) || // Syllables
    (code >= 0x3130 && code <= 0x318F) // Compatibility Jamo (ㄱ, ㄴ, ㅏ...)
  );
}

/**
 * Decomposes a Hangul syllable or basic Jamo into basic consonants and vowels.
 * Returns an array of basic Jamo components.
 * E.g., '한' -> ['ㅎ', 'ㅏ', 'ㄴ']
 * E.g., '값' -> ['ㄱ', 'ㅏ', 'ㅂ', 'ㅅ']
 * E.g., 'ㅘ' -> ['ㅗ', 'ㅏ']
 */
export function decomposeHangul(char: string): string[] {
  if (!char) return [];
  const code = char.charCodeAt(0);

  // If it's a composed Hangul syllable
  if (code >= HANGUL_BASE && code <= HANGUL_END) {
    const index = code - HANGUL_BASE;
    const choseongIndex = Math.floor(index / 588);
    const jungseongIndex = Math.floor((index % 588) / 28);
    const jongseongIndex = index % 28;

    const components: string[] = [];

    // Choseong
    components.push(CHOSEONG_LIST[choseongIndex]);

    // Jungseong (with potential compound split)
    const jung = JUNGSEONG_LIST[jungseongIndex];
    if (JUNGSEONG_SPLIT[jung]) {
      components.push(...JUNGSEONG_SPLIT[jung]);
    } else {
      components.push(jung);
    }

    // Jongseong (with potential compound split)
    const jong = JONGSEONG_LIST[jongseongIndex];
    if (jong) {
      if (JONGSEONG_SPLIT[jong]) {
        components.push(...JONGSEONG_SPLIT[jong]);
      } else {
        components.push(jong);
      }
    }

    return components;
  }

  // If it's a compatibility Jamo (already decomposed, but check compound split)
  if (code >= 0x3130 && code <= 0x318F) {
    if (JONGSEONG_SPLIT[char]) {
      return JONGSEONG_SPLIT[char];
    }
    if (JUNGSEONG_SPLIT[char]) {
      return JUNGSEONG_SPLIT[char];
    }
    return [char];
  }

  // Return non-Hangul characters as is
  return [char];
}

/**
 * Returns whether inputChar is a partial progression match of targetChar.
 * This checks if the Jamo-based representation of inputChar is a prefix of targetChar.
 * Helpful for preventing flash of red errors while a student is composing a character.
 */
export function isPartialMatch(targetChar: string, inputChar: string): boolean {
  if (!targetChar || !inputChar) return false;
  if (targetChar === inputChar) return true;

  // Only apply to Hangul
  if (!isHangul(targetChar) || !isHangul(inputChar)) {
    return targetChar.toLowerCase() === inputChar.toLowerCase();
  }

  const targetJamos = decomposeHangul(targetChar);
  const inputJamos = decomposeHangul(inputChar);

  if (inputJamos.length > targetJamos.length) return false;

  for (let i = 0; i < inputJamos.length; i++) {
    if (targetJamos[i] !== inputJamos[i]) {
      return false;
    }
  }

  return true;
}
