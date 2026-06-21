import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const styleSource = readFileSync(
  new URL('./BlokExperience.module.sass', import.meta.url),
  'utf8',
);

test('mobile experience title keeps the same padding rhythm as stacked titles', () => {
  const blokNameBlock =
    styleSource.match(/\.blokName[\s\S]*?(?=\n\.content)/)?.[0] || '';

  assert.match(
    blokNameBlock,
    /@media \(max-width: 770px\)[\s\S]*padding: var\(--spacing-base\) var\(--spacing-side\)/,
  );
  assert.doesNotMatch(blokNameBlock, /padding-top: 0/);
});
