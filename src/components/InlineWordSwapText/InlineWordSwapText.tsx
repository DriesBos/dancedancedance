import { Fragment } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import styles from './InlineWordSwapText.module.sass';

type TextSegment =
  | { type: 'text'; value: string }
  | { type: 'rotator'; first: string; second: string };

type RotatorStyle = CSSProperties & {
  '--rotator-duration': string;
};

const ROTATOR_TOKEN_REGEX = /([^\s=]+)\s*=\s*([^\s=]+)/g;
const ROTATOR_DURATION_MIN_SECONDS = 4;
const ROTATOR_DURATION_MAX_SECONDS = 6;

const hashToUnitInterval = (value: string) => {
  // FNV-1a style hash for stable pseudo-random values across server/client render
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
};

const parseTextSegments = (text: string): TextSegment[] => {
  const segments: TextSegment[] = [];
  let cursor = 0;

  const matches = text.matchAll(ROTATOR_TOKEN_REGEX);
  for (const match of matches) {
    const index = match.index ?? 0;

    if (index > cursor) {
      segments.push({ type: 'text', value: text.slice(cursor, index) });
    }

    segments.push({ type: 'rotator', first: match[1], second: match[2] });
    cursor = index + match[0].length;
  }

  if (cursor < text.length) {
    segments.push({ type: 'text', value: text.slice(cursor) });
  }

  return segments.length > 0 ? segments : [{ type: 'text', value: text }];
};

const RotatorToken = ({
  first,
  second,
  durationSeconds,
}: {
  first: string;
  second: string;
  durationSeconds: number;
}) => {
  const style: RotatorStyle = {
    '--rotator-duration': `${durationSeconds.toFixed(3)}s`,
  };

  return (
    <span className={styles.rotator}>
      <span className={styles.rotatorSizer} aria-hidden="true">
        <span className={styles.rotatorWord}>{first}</span>
        <span className={styles.rotatorWord}>{second}</span>
      </span>
      <span className={styles.rotatorViewport}>
        <span className={styles.rotatorTrack} style={style}>
          <span className={styles.rotatorWord}>{first}</span>
          <span className={styles.rotatorWord}>{second}</span>
          <span className={styles.rotatorWord} aria-hidden="true">
            {first}
          </span>
        </span>
      </span>
    </span>
  );
};

export const renderWordSwapText = (text: string, keyPrefix: string): ReactNode =>
  parseTextSegments(text).map((segment, index) => {
    if (segment.type === 'text') {
      return (
        <Fragment key={`${keyPrefix}-text-${index}`}>{segment.value}</Fragment>
      );
    }

    const seed = `${keyPrefix}-${index}-${segment.first}-${segment.second}`;
    const randomUnit = hashToUnitInterval(seed);
    const durationSeconds =
      ROTATOR_DURATION_MIN_SECONDS +
      randomUnit * (ROTATOR_DURATION_MAX_SECONDS - ROTATOR_DURATION_MIN_SECONDS);

    return (
      <RotatorToken
        key={`${keyPrefix}-rotator-${index}`}
        first={segment.first}
        second={segment.second}
        durationSeconds={durationSeconds}
      />
    );
  });

export const renderWordSwapChildren = (
  children: ReactNode,
  keyPrefix: string,
): ReactNode =>
  (Array.isArray(children) ? children : [children]).map((child, index) => {
    if (typeof child === 'string') {
      return (
        <Fragment key={`${keyPrefix}-child-${index}`}>
          {renderWordSwapText(child, `${keyPrefix}-segment-${index}`)}
        </Fragment>
      );
    }

    return child;
  });

interface InlineWordSwapTextProps {
  text: string;
  keyPrefix: string;
}

const InlineWordSwapText = ({ text, keyPrefix }: InlineWordSwapTextProps) => (
  <>{renderWordSwapText(text, keyPrefix)}</>
);

export default InlineWordSwapText;
