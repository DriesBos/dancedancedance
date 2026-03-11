'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, PointerEvent, ReactNode } from 'react';
import styles from './InlineWordSwapText.module.sass';

type TextSegment =
  | { type: 'text'; value: string }
  | { type: 'rotator'; first: string; second: string };

type TokenFormat = 'equals' | 'emdash' | 'ampersand';

type RotatorStyle = CSSProperties & {
  '--rotator-duration': string;
};

const ROTATOR_EQUALS_TOKEN_REGEX = /([^\s=]+)\s*=\s*([^\s=]+)/g;
const ROTATOR_EMDASH_TOKEN_REGEX = /^(\s*)(.+?)\s+—\s+(.+?)(\s*)$/;
const ROTATOR_AMPERSAND_TOKEN_REGEX = /^(\s*)(.+?)\s+&\s+(.+?)(\s*)$/;
const ROTATOR_DURATION_MIN_SECONDS = 4;
const ROTATOR_DURATION_MAX_SECONDS = 6;
const SWAP_TRANSITION_MS = 200;

const getTerminalPunctuation = (word: string) => {
  const lastCharacter = word.at(-1);
  if (lastCharacter === '.' || lastCharacter === ',') {
    return lastCharacter;
  }

  return null;
};

const normalizeTerminalPunctuation = (first: string, second: string) => {
  const firstPunctuation = getTerminalPunctuation(first);
  const secondPunctuation = getTerminalPunctuation(second);

  if (!firstPunctuation && !secondPunctuation) {
    return { first, second };
  }

  if (firstPunctuation && secondPunctuation) {
    return { first, second };
  }

  if (firstPunctuation) {
    return { first, second: `${second}${firstPunctuation}` };
  }

  return { first: `${first}${secondPunctuation}`, second };
};

const hashToUnitInterval = (value: string) => {
  // FNV-1a style hash for stable pseudo-random values across server/client render
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
};

const parseTextSegments = (
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

    const [, leadingText, firstWord, secondWord, trailingText] = delimiterMatch;
    const normalizedWords = normalizeTerminalPunctuation(firstWord, secondWord);
    const formattedFirstWord =
      tokenFormat === 'ampersand'
        ? `${normalizedWords.first} &`
        : normalizedWords.first;
    const segments: TextSegment[] = [];

    if (leadingText) {
      segments.push({ type: 'text', value: leadingText });
    }

    segments.push({
      type: 'rotator',
      first: formattedFirstWord,
      second: normalizedWords.second,
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

    const normalizedWords = normalizeTerminalPunctuation(match[1], match[2]);
    segments.push({
      type: 'rotator',
      first: normalizedWords.first,
      second: normalizedWords.second,
    });
    cursor = index + match[0].length;
  }

  if (cursor < text.length) {
    segments.push({ type: 'text', value: text.slice(cursor) });
  }

  return segments.length > 0 ? segments : [{ type: 'text', value: text }];
};

interface RenderWordSwapOptions {
  tokenFormat?: TokenFormat;
  durationSeconds?: number;
}

const RotatorToken = ({
  first,
  second,
  durationSeconds,
}: {
  first: string;
  second: string;
  durationSeconds: number;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'hold' | 'slide'>('hold');
  const currentWord = currentIndex === 0 ? first : second;
  const nextWord = currentIndex === 0 ? second : first;
  const holdDurationMs = useMemo(
    () =>
      Math.max(
        400,
        ((durationSeconds * 1000 - SWAP_TRANSITION_MS * 2) / 2) | 0,
      ),
    [durationSeconds],
  );

  useEffect(() => {
    setCurrentIndex(0);
    setPhase('hold');
  }, [first, second]);

  useEffect(() => {
    const timeout =
      phase === 'hold'
        ? window.setTimeout(() => {
            setPhase('slide');
          }, holdDurationMs)
        : window.setTimeout(() => {
            setCurrentIndex((prev) => (prev === 0 ? 1 : 0));
            setPhase('hold');
          }, SWAP_TRANSITION_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [phase, holdDurationMs]);

  const triggerSwap = () => {
    if (phase === 'hold') {
      setPhase('slide');
    }
  };

  const handleMouseEnter = () => {
    triggerSwap();
  };

  const handlePointerDown = (event: PointerEvent<HTMLSpanElement>) => {
    if (event.pointerType === 'touch') {
      triggerSwap();
    }
  };

  const handleTouchStart = () => {
    triggerSwap();
  };

  const style: RotatorStyle = {
    '--rotator-duration': `${SWAP_TRANSITION_MS}ms`,
  };

  return (
    <span
      className={styles.rotator}
      onMouseEnter={handleMouseEnter}
      onPointerDown={handlePointerDown}
      onTouchStart={handleTouchStart}
    >
      <span className={styles.rotatorSizer} aria-hidden="true">
        <span className={styles.rotatorWord}>{first}</span>
        <span className={styles.rotatorWord}>{second}</span>
      </span>
      <span className={styles.rotatorViewport}>
        <span
          className={`${styles.rotatorTrack} ${phase === 'slide' ? styles.isAnimating : ''}`}
          style={style}
        >
          <span className={styles.rotatorWord}>{currentWord}</span>
          <span className={styles.rotatorWord}>{nextWord}</span>
          <span className={styles.rotatorWord} aria-hidden="true">
            {currentWord}
          </span>
        </span>
      </span>
    </span>
  );
};

export const renderWordSwapText = (
  text: string,
  keyPrefix: string,
  options: RenderWordSwapOptions = {},
): ReactNode =>
  parseTextSegments(text, options.tokenFormat ?? 'equals').map(
    (segment, index) => {
    if (segment.type === 'text') {
      return (
        <Fragment key={`${keyPrefix}-text-${index}`}>{segment.value}</Fragment>
      );
    }

    const seed = `${keyPrefix}-${index}-${segment.first}-${segment.second}`;
    const randomUnit = hashToUnitInterval(seed);
    const resolvedDurationSeconds =
      options.durationSeconds && options.durationSeconds > 0
        ? options.durationSeconds
        : ROTATOR_DURATION_MIN_SECONDS +
          randomUnit *
            (ROTATOR_DURATION_MAX_SECONDS - ROTATOR_DURATION_MIN_SECONDS);

    return (
      <RotatorToken
        key={`${keyPrefix}-rotator-${index}`}
        first={segment.first}
        second={segment.second}
        durationSeconds={resolvedDurationSeconds}
      />
    );
    },
  );

export const renderWordSwapChildren = (
  children: ReactNode,
  keyPrefix: string,
  options: RenderWordSwapOptions = {},
): ReactNode =>
  (Array.isArray(children) ? children : [children]).map((child, index) => {
    if (typeof child === 'string') {
      return (
        <Fragment key={`${keyPrefix}-child-${index}`}>
          {renderWordSwapText(child, `${keyPrefix}-segment-${index}`, options)}
        </Fragment>
      );
    }

    return child;
  });

interface InlineWordSwapTextProps {
  text: string;
  keyPrefix: string;
  tokenFormat?: TokenFormat;
  durationSeconds?: number;
}

const InlineWordSwapText = ({
  text,
  keyPrefix,
  tokenFormat,
  durationSeconds,
}: InlineWordSwapTextProps) => (
  <>{renderWordSwapText(text, keyPrefix, { tokenFormat, durationSeconds })}</>
);

export default InlineWordSwapText;
