import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const storyblokStoriesSource = readFileSync(
  new URL('./storyblok-stories.ts', import.meta.url),
  'utf8',
);

test('published Storyblok story list fetch paginates past the first 100 stories', () => {
  assert.match(storyblokStoriesSource, /STORYBLOK_STORIES_PER_PAGE\s*=\s*100/);
  assert.match(storyblokStoriesSource, /fetchStoryPage\(1\)/);
  assert.match(storyblokStoriesSource, /Math\.ceil\([^)]*total[^)]*\)/s);
  assert.match(storyblokStoriesSource, /fetchStoryPage\(currentPage\)/);
  assert.match(storyblokStoriesSource, /Promise\.all/);
  assert.match(storyblokStoriesSource, /\.flat\(\)/);
});
