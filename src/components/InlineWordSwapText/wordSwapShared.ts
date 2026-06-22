import type { ReactNode } from 'react';

export type TextSegment =
  | { type: 'text'; value: string }
  | { type: 'rotator'; words: string[] };

export type TokenFormat = 'equals' | 'emdash' | 'ampersand';

const ROTATOR_EQUALS_TOKEN_REGEX = /([^\s=]+(?:\s*=\s*[^\s=]+)+)/g;
const ROTATOR_EMDASH_TOKEN_REGEX = /^(\s*)(.+?)\s+—\s+(.+?)(\s*)$/;
const ROTATOR_AMPERSAND_TOKEN_REGEX = /^(\s*)(.+?)\s+&\s+(.+?)(\s*)$/;

export const ROTATOR_DURATION_MIN_SECONDS = 4;
export const ROTATOR_DURATION_MAX_SECONDS = 6;
export const SWAP_TRANSITION_MS = 200;

const getTerminalPunctuation = (word: string) => {
  const lastCharacter = word.at(-1);
  if (lastCharacter === '.' || lastCharacter === ',') {
    return lastCharacter;
  }

  return null;
};

const normalizeTerminalPunctuation = (words: string[]) => {
  const punctuations = words
    .map((word) => getTerminalPunctuation(word))
    .filter((punctuation): punctuation is '.' | ',' => punctuation !== null);

  if (punctuations.length === 0 || punctuations.length === words.length) {
    return words;
  }

  const firstPunctuation = punctuations[0];
  if (!firstPunctuation) {
    return words;
  }

  const allSamePunctuation = punctuations.every(
    (punctuation) => punctuation === firstPunctuation,
  );

  if (!allSamePunctuation) {
    return words;
  }

  return words.map((word) =>
    getTerminalPunctuation(word) ? word : `${word}${firstPunctuation}`,
  );
};

export const hashToUnitInterval = (value: string) => {
  // FNV-1a style hash for stable pseudo-random values across server/client render
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
};

export const parseTextSegments = (
  text: string,
  tokenFormat: TokenFormat,
): TextSegment[] => {
  if (tokenFormat === 'emdash' || tokenFormat === 'ampersand') {
    const delimiterMatch = text.match(
      tokenFormat === 'emdash'
        ? ROTATOR_EMDASH_TOKEN_REGEX
        : ROTATOR_AMPERSAND_TOKEN_REGEX,
    );

    if (!delimiterMatch) {
      return [{ type: 'text', value: text }];
    }

    const leadingText = delimiterMatch[1] ?? '';
    const firstWord = delimiterMatch[2];
    const secondWord = delimiterMatch[3];
    const trailingText = delimiterMatch[4] ?? '';

    if (!firstWord || !secondWord) {
      return [{ type: 'text', value: text }];
    }

    const normalizedWords = normalizeTerminalPunctuation([firstWord, secondWord]);
    const firstNormalizedWord = normalizedWords[0];
    const secondNormalizedWord = normalizedWords[1];

    if (!firstNormalizedWord || !secondNormalizedWord) {
      return [{ type: 'text', value: text }];
    }

    const formattedFirstWord =
      tokenFormat === 'ampersand'
        ? `${firstNormalizedWord} &`
        : firstNormalizedWord;
    const segments: TextSegment[] = [];

    if (leadingText) {
      segments.push({ type: 'text', value: leadingText });
    }

    segments.push({
      type: 'rotator',
      words: [formattedFirstWord, secondNormalizedWord],
    });

    if (trailingText) {
      segments.push({ type: 'text', value: trailingText });
    }

    return segments;
  }

  const segments: TextSegment[] = [];
  let cursor = 0;

  const matches = text.matchAll(ROTATOR_EQUALS_TOKEN_REGEX);
  for (const match of matches) {
    const index = match.index ?? 0;

    if (index > cursor) {
      segments.push({ type: 'text', value: text.slice(cursor, index) });
    }

    const rawToken = match[1];
    if (!rawToken) {
      continue;
    }

    const rawWords = rawToken.split(/\s*=\s*/).filter(Boolean);
    const normalizedWords = normalizeTerminalPunctuation(rawWords);

    segments.push({
      type: 'rotator',
      words: normalizedWords,
    });
    cursor = index + match[0].length;
  }

  if (cursor < text.length) {
    segments.push({ type: 'text', value: text.slice(cursor) });
  }

  return segments.length > 0 ? segments : [{ type: 'text', value: text }];
};

export interface RenderWordSwapOptions {
  tokenFormat?: TokenFormat;
  durationSeconds?: number;
}

export const resolveDurationSeconds = (
  seed: string,
  durationSeconds?: number,
) => {
  if (durationSeconds && durationSeconds > 0) {
    return durationSeconds;
  }

  const randomUnit = hashToUnitInterval(seed);

  return (
    ROTATOR_DURATION_MIN_SECONDS +
    randomUnit * (ROTATOR_DURATION_MAX_SECONDS - ROTATOR_DURATION_MIN_SECONDS)
  );
};

export type WordSwapChild = ReactNode;
