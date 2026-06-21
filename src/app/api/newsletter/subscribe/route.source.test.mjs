import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const routeSource = readFileSync(new URL('./route.ts', import.meta.url), 'utf8');

test('newsletter tag failure check relies on Response.ok only', () => {
  assert.match(routeSource, /if \(!tagResponse\.ok\) \{/);
  assert.doesNotMatch(routeSource, /tagResponse\.status !== 204/);
});
