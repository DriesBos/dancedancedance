'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import { SWAP_TRANSITION_MS } from './wordSwapShared';
import styles from './InlineWordSwapText.module.sass';

type RotatorStyle = CSSProperties & {
  '--rotator-duration': string;
};

interface WordSwapRotatorClientProps {
  first: string;
  second: string;
  durationSeconds: number;
}

const WordSwapRotatorClient = ({
  first,
  second,
  durationSeconds,
}: WordSwapRotatorClientProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'hold' | 'slide'>('hold');
  const currentWord = currentIndex === 0 ? first : second;
  const nextWord = currentIndex === 0 ? second : first;
  const holdDurationMs = useMemo(
    () =>
      Math.max(400, ((durationSeconds * 1000 - SWAP_TRANSITION_MS * 2) / 2) | 0),
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

export default WordSwapRotatorClient;
