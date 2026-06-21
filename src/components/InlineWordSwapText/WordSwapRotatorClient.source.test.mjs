import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const rotatorSource = readFileSync(
  new URL('./WordSwapRotatorClient.tsx', import.meta.url),
  'utf8',
);

test('word swap rotator keeps words as an array without string serialization', () => {
  assert.doesNotMatch(rotatorSource, /useMemo/);
  assert.doesNotMatch(rotatorSource, /wordsKey/);
  assert.doesNotMatch(rotatorSource, /join\('\\u001f'\)/);
  assert.doesNotMatch(rotatorSource, /split\('\\u001f'\)/);
  assert.match(rotatorSource, /const normalizedWords =\n\s+words\.length >= 2/);
});
