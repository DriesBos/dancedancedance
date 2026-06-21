import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const newsletterSource = readFileSync(
  new URL('./Newsletter.tsx', import.meta.url),
  'utf8',
);

test('newsletter text scrambling is owned by one reusable hook', () => {
  assert.match(newsletterSource, /const useTextScramble = /);
  assert.equal((newsletterSource.match(/useGSAP\(/g) || []).length, 1);
  assert.match(newsletterSource, /useTextScramble\(buttonTextRef, buttonText\)/);
  assert.match(newsletterSource, /useTextScramble\(messageRef, message\)/);
  assert.doesNotMatch(newsletterSource, /Playful scramble animation for message text/);
});
