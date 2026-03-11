import { Fragment } from 'react';
import type { ReactNode } from 'react';
import WordSwapRotatorClient from './WordSwapRotatorClient';
import {
  parseTextSegments,
  resolveDurationSeconds,
  type RenderWordSwapOptions,
} from './wordSwapShared';

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

      const seed = `${keyPrefix}-${index}-${segment.words.join('|')}`;
      const durationSeconds = resolveDurationSeconds(seed, options.durationSeconds);

      return (
        <WordSwapRotatorClient
          key={`${keyPrefix}-rotator-${index}`}
          words={segment.words}
          durationSeconds={durationSeconds}
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
