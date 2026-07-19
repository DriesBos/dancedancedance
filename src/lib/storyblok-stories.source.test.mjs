import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const storyblokStoriesSource = readFileSync(
  new URL('./storyblok-stories.ts', import.meta.url),
  'utf8',
);

test('published Storyblok story list fetch paginates past the first 100 stories', () => {
  assert.match(storyblokStoriesSource, /STORYBLOK_STORIES_PER_PAGE\s*=\s*100/);
  assert.match(storyblokStoriesSource, /for \(let page = 1; ; page \+= 1\)/);
  assert.match(storyblokStoriesSource, /fetchStoryPage\(page\)/);
  assert.match(storyblokStoriesSource, /stories\.push\(\.\.\.pageStories\)/);
  assert.match(storyblokStoriesSource, /pageStories\.length < STORYBLOK_STORIES_PER_PAGE/);
  assert.doesNotMatch(storyblokStoriesSource, /Promise\.all|PAGE_BATCH_SIZE/);
});
