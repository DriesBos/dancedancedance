import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const rotatorSource = readFileSync(
  new URL('./WordSwapRotatorClient.tsx', import.meta.url),
  'utf8',
);

test('word swap rotator keeps words as an array without string serialization', () => {
  assert.doesNotMatch(rotatorSource, /useMemo/);
  assert.doesNotMatch(rotatorSource, /split\('\\u00/);
  assert.match(rotatorSource, /const normalizedWords =\n\s+words\.length >= 2/);
});

test('word swap rotator reset effect is keyed on word content, not array identity', () => {
  // The parent re-parses segments every render, so `[words]` would restart
  // the rotation on any parent re-render.
  assert.doesNotMatch(rotatorSource, /\}, \[words\]\);/);
  assert.match(rotatorSource, /const wordsKey = words\.join\(/);
  assert.match(rotatorSource, /\}, \[wordsKey\]\);/);
});
