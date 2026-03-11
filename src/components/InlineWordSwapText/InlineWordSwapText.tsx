'use client';

import { renderWordSwapText } from './renderWordSwap';
import type { TokenFormat } from './wordSwapShared';

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
