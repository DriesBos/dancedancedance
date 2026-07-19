import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const routeSource = readFileSync(new URL('./route.ts', import.meta.url), 'utf8');
const netlifySource = readFileSync(
  new URL('../../../../../netlify.toml', import.meta.url),
  'utf8',
);

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

test('newsletter route keeps bot protection before Mailchimp', () => {
  const botGateIndex = routeSource.indexOf('if (isBotSubmission(payload))');
  const firstFetchIndex = routeSource.indexOf('await fetch(');

  assert.notEqual(botGateIndex, -1);
  assert.notEqual(firstFetchIndex, -1);
  assert.ok(botGateIndex < firstFetchIndex);
  assert.doesNotMatch(routeSource, /rateLimitBuckets|isRateLimited/);
});

test('newsletter route rejects cross-origin and oversized submissions before parsing JSON', () => {
  const sizeGateIndex = routeSource.indexOf('contentLength > MAX_REQUEST_BYTES');
  const originGateIndex = routeSource.indexOf('if (!isSameOriginRequest(request))');
  const jsonParseIndex = routeSource.indexOf('await request.json()');

  assert.notEqual(sizeGateIndex, -1);
  assert.notEqual(originGateIndex, -1);
  assert.notEqual(jsonParseIndex, -1);
  assert.ok(sizeGateIndex < jsonParseIndex);
  assert.ok(originGateIndex < jsonParseIndex);
  assert.match(routeSource, /const SITE_ORIGIN = new URL\(getSiteUrl\(\)\)\.origin;/);
  assert.match(routeSource, /const getRequestOrigin = \(request: Request\) =>/);
  assert.match(routeSource, /request\.headers\.get\('x-forwarded-host'\)/);
  assert.match(routeSource, /return referer === requestOrigin;/);
});

test('newsletter endpoint has a Netlify platform rate limit', () => {
  assert.match(netlifySource, /from = "\/api\/newsletter\/subscribe"/);
  assert.match(netlifySource, /\[redirects\.rate_limit\]/);
  assert.match(netlifySource, /window_limit = 5/);
  assert.match(netlifySource, /aggregate_by = \["ip", "domain"\]/);
});
