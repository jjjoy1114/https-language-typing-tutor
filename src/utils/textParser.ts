import { TypingMode } from '../types';

/**
 * Splits a very long text line into smaller, readable chunks of a target maximum length
 * without cutting words in half.
 */
function chunkLongLine(line: string, maxLength = 65): string[] {
  if (line.length <= maxLength) {
    return [line];
  }

  // First, try splitting by sentence punctuation (. ? !)
  const sentenceBoundaryRegex = /(?<=[.?!])\s+/;
  const parts = line.split(sentenceBoundaryRegex);
  
  const chunks: string[] = [];
  let currentChunk = '';

  for (const part of parts) {
    const trimmedPart = part.trim();
    if (!trimmedPart) continue;

    if (trimmedPart.length <= maxLength) {
      if (!currentChunk) {
        currentChunk = trimmedPart;
      } else if ((currentChunk + ' ' + trimmedPart).length <= maxLength) {
        currentChunk += ' ' + trimmedPart;
      } else {
        chunks.push(currentChunk);
        currentChunk = trimmedPart;
      }
    } else {
      // If a single segment is still longer than maxLength, split it by spaces
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      
      const words = trimmedPart.split(/\s+/);
      let wordAccumulator = '';
      for (const word of words) {
        if (!wordAccumulator) {
          wordAccumulator = word;
        } else if ((wordAccumulator + ' ' + word).length <= maxLength) {
          wordAccumulator += ' ' + word;
        } else {
          chunks.push(wordAccumulator);
          wordAccumulator = word;
        }
      }
      if (wordAccumulator) {
        chunks.push(wordAccumulator);
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.filter(c => c.length > 0);
}

/**
 * Parses raw text into segmented arrays based on the practice mode.
 */
export function parseText(rawText: string, mode: TypingMode): string[] {
  if (!rawText || rawText.trim() === '') {
    return [];
  }

  // Normalize line endings and whitespace
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  switch (mode) {
    case 'word': {
      // Split by spaces, tabs, or newlines to extract single words
      return normalized
        .split(/[\s\n]+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 0 && !/[\n\r]/.test(w));
    }

    case 'sentence': {
      // Split by lines or sentence punctuations initially
      const lines = normalized.split('\n');
      const segments: string[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length > 0) {
          segments.push(...chunkLongLine(trimmed, 65));
        }
      }

      // If we got nothing but have raw content, try splitting by sentence punctuation
      if (segments.length === 0) {
        const punctuationSegments = normalized
          .split(/(?<=[.?!])\s+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        for (const seg of punctuationSegments) {
          segments.push(...chunkLongLine(seg, 65));
        }
      }

      return segments;
    }

    case 'paragraph': {
      // Split by double newlines or single newlines with solid length to construct paragraphs
      const lines = normalized.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      const segments: string[] = [];
      
      for (const line of lines) {
        segments.push(...chunkLongLine(line, 65));
      }
      
      return segments;
    }

    default:
      return [rawText];
  }
}

/**
 * Calculates typing statistics.
 * @param correctChars Count of correctly typed characters/strokes
 * @param totalKeystrokes Count of overall keys pressed
 * @param timeSeconds Elapsed time in seconds
 * @param isKorean Optional flag to adjust WPM divisor for Korean jamo density
 */
export function calculateStats(
  correctChars: number,
  totalKeystrokes: number,
  timeSeconds: number,
  isKorean?: boolean
) {
  if (timeSeconds <= 0) {
    return { wpm: 0, cpm: 0, accuracy: 100 };
  }

  const minutes = timeSeconds / 60;
  
  // Characters Per Minute (CPM)
  const cpm = Math.round(correctChars / minutes);
  
  // Words Per Minute (WPM): Standard typing assumptions.
  // In English, 1 word = 5 characters.
  // In Korean, correctChars counts individual Jamos. An average Korean word (어절, eo-jeol)
  // consists of ~3 syllables, translating to ~7.5 to 8 keystrokes (Jamos).
  // Dividing Korean correctChars by 8 instead of 5 provides an uninflated, realistic WPM.
  const divisor = isKorean ? 8 : 5;
  const wpm = Math.round((correctChars / divisor) / minutes);
  
  // Accuracy (%)
  // To strictly prevent accuracy from ever exceeding 100% (e.g., due to asynchronous state updates
  // or IME composition differences), we clamp the totalKeystrokes to be at least correctChars.
  const effectiveKeystrokes = Math.max(correctChars, totalKeystrokes);
  const accuracy = effectiveKeystrokes > 0 
    ? Math.round((correctChars / effectiveKeystrokes) * 100) 
    : 100;

  return {
    wpm: Math.max(0, wpm),
    cpm: Math.max(0, cpm),
    accuracy: Math.min(100, Math.max(0, accuracy))
  };
}
