'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import { SWAP_TRANSITION_MS } from './wordSwapShared';
import styles from './InlineWordSwapText.module.sass';

type RotatorStyle = CSSProperties & {
  '--rotator-duration': string;
};

interface WordSwapRotatorClientProps {
  words: string[];
  durationSeconds: number;
}

const WordSwapRotatorClient = ({
  words,
  durationSeconds,
}: WordSwapRotatorClientProps) => {
  const normalizedWords = useMemo(
    () => (words.length >= 2 ? words : [words[0] ?? '', words[0] ?? '']),
    [words],
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'hold' | 'slide'>('hold');
  const nextIndex = (currentIndex + 1) % normalizedWords.length;
  const currentWord = normalizedWords[currentIndex];
  const nextWord = normalizedWords[nextIndex];
  const holdDurationMs = useMemo(
    () =>
      Math.max(
        400,
        ((durationSeconds * 1000 -
          SWAP_TRANSITION_MS * normalizedWords.length) /
          normalizedWords.length) |
          0,
      ),
    [durationSeconds, normalizedWords.length],
  );

  useEffect(() => {
    setCurrentIndex(0);
    setPhase('hold');
  }, [normalizedWords]);

  useEffect(() => {
    const timeout =
      phase === 'hold'
        ? window.setTimeout(() => {
            setPhase('slide');
          }, holdDurationMs)
        : window.setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % normalizedWords.length);
            setPhase('hold');
          }, SWAP_TRANSITION_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [phase, holdDurationMs, normalizedWords.length]);

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
    '--rotator-duration':
      phase === 'slide' ? `${SWAP_TRANSITION_MS}ms` : '0ms',
  };

  return (
    <span
      className={styles.rotator}
      onMouseEnter={handleMouseEnter}
      onPointerDown={handlePointerDown}
      onTouchStart={handleTouchStart}
    >
      <span className={styles.rotatorSizer} aria-hidden="true">
        {normalizedWords.map((word, index) => (
          <span className={styles.rotatorWord} key={`sizer-${index}-${word}`}>
            {word}
          </span>
        ))}
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

export default WordSwapRotatorClient;
