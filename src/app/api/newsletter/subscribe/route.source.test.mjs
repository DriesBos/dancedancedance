import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const routeSource = readFileSync(new URL('./route.ts', import.meta.url), 'utf8');

test('newsletter tag failure check relies on Response.ok only', () => {
  assert.match(routeSource, /if \(!tagResponse\.ok\) \{/);
  assert.doesNotMatch(routeSource, /tagResponse\.status !== 204/);
});

test('newsletter route normalizes email once before Mailchimp and hashing', () => {
  assert.match(routeSource, /const normalizeEmail = \(value: unknown\) =>/);
  assert.match(routeSource, /const email = normalizeEmail\(payload\.email\);/);
  assert.match(routeSource, /email_address: email/);
  assert.match(routeSource, /\.update\(email\)/);
  assert.doesNotMatch(routeSource, /\.update\(email\.toLowerCase\(\)\)/);
});

test('newsletter route validates email shape before external calls', () => {
  const invalidEmailIndex = routeSource.indexOf('if (!isValidEmail(email))');
  const firstFetchIndex = routeSource.indexOf('await fetch(');

  assert.notEqual(invalidEmailIndex, -1);
  assert.notEqual(firstFetchIndex, -1);
  assert.ok(invalidEmailIndex < firstFetchIndex);
  assert.match(routeSource, /const isValidEmail = \(email: string\) =>/);
  assert.match(routeSource, /email\.length <= 254/);
});

test('newsletter route has simple bot and rate protection before Mailchimp', () => {
  const botGateIndex = routeSource.indexOf('if (isBotSubmission(payload))');
  const rateLimitIndex = routeSource.indexOf('if (isRateLimited(getClientKey(request)))');
  const firstFetchIndex = routeSource.indexOf('await fetch(');

  assert.notEqual(botGateIndex, -1);
  assert.notEqual(rateLimitIndex, -1);
  assert.notEqual(firstFetchIndex, -1);
  assert.ok(botGateIndex < firstFetchIndex);
  assert.ok(rateLimitIndex < firstFetchIndex);
  assert.match(routeSource, /const RATE_LIMIT_WINDOW_MS = 60_000;/);
  assert.match(routeSource, /const RATE_LIMIT_MAX_REQUESTS = 5;/);
});
