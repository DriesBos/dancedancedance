import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readSource = (path) =>
  readFileSync(new URL(path, import.meta.url), 'utf8');

test('storyblok cv and cache helpers avoid redundant normalization noise', () => {
  const cvSource = readSource('./storyblok-cv.ts');
  const cacheSource = readSource('./storyblok-cache.ts');

  assert.doesNotMatch(cvSource, /return cv \?\? undefined/);
  assert.doesNotMatch(cvSource, /unstable_cache/);
  assert.doesNotMatch(cvSource, /\?token=\$\{encodeURIComponent\(token\)\}/);
  assert.doesNotMatch(cvSource, /STORYBLOK_CV_CACHE_KEY/);
  assert.match(cvSource, /url\.searchParams\.set\('token', token\)/);
  assert.doesNotMatch(cacheSource, /getStoryblokSlugTag\(normalizedSlug\)/);
  assert.match(cacheSource, /`storyblok:slug:\$\{normalizedSlug\}`/);
});

test('storyblok revalidation uses call fallback instead of revalidateTag arity checks', () => {
  const source = readSource('../app/api/storyblok/revalidate/route.ts');

  assert.doesNotMatch(source, /revalidateTag\.length/);
  assert.match(source, /try \{/);
  assert.match(source, /catch/);
  assert.match(source, /revalidateTagWithProfile\(tag, 'max'\)/);
});

test('storyblok revalidation compares webhook secrets in constant time', () => {
  const source = readSource('../app/api/storyblok/revalidate/route.ts');

  assert.match(source, /timingSafeEqual/);
  assert.match(source, /safeCompareSecret/);
  assert.doesNotMatch(source, /incomingSecret !== configuredSecret/);
  assert.doesNotMatch(source, /export const dynamic = 'force-dynamic'/);
});

test('page story fetches use storyblok cache tags revalidated by the webhook', () => {
  const fetchStorySource = readSource('../utils/fetchstory.ts');
  const cacheSource = readSource('./storyblok-cache.ts');
  const revalidateSource = readSource('../app/api/storyblok/revalidate/route.ts');

  assert.match(fetchStorySource, /STORYBLOK_TAG_ALL/);
  assert.doesNotMatch(fetchStorySource, /['"`]cms['"`]/);
  assert.match(cacheSource, /export const STORYBLOK_TAG_ALL = 'storyblok'/);
  assert.match(revalidateSource, /new Set<string>\(\[STORYBLOK_TAG_ALL/);
});
