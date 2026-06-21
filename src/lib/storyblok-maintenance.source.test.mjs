import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readSource = (path) =>
  readFileSync(new URL(path, import.meta.url), 'utf8');

test('storyblok cv and cache helpers avoid redundant normalization noise', () => {
  const cvSource = readSource('./storyblok-cv.ts');
  const cacheSource = readSource('./storyblok-cache.ts');

  assert.doesNotMatch(cvSource, /return cv \?\? undefined/);
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
