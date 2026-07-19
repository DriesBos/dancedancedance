import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const fetchProjectsSource = readFileSync(
  new URL('./fetch-projects.ts', import.meta.url),
  'utf8',
);
const storyblokStoriesSource = readFileSync(
  new URL('./storyblok-stories.ts', import.meta.url),
  'utf8',
);
const removedThumbnailFieldPattern = new RegExp('thumbnail_' + 'new');

test('project data has one Storyblok API caller and slug list derives from it', () => {
  assert.match(fetchProjectsSource, /export async function fetchProjectData/);
  assert.doesNotMatch(fetchProjectsSource, removedThumbnailFieldPattern);
  assert.doesNotMatch(fetchProjectsSource, /getPreferredThumbnail/);
  assert.match(fetchProjectsSource, /thumbnail: story\.content\.thumbnail/);
  assert.match(fetchProjectsSource, /fetchPublishedStoryList/);
  assert.doesNotMatch(fetchProjectsSource, /storyblokApi\.get/);
  assert.match(fetchProjectsSource, /export async function fetchProjectSlugs/);
  assert.match(fetchProjectsSource, /await fetchProjectData\(\)/);
  assert.match(storyblokStoriesSource, /getOptionalStoryblokApi/);
  assert.match(storyblokStoriesSource, /if \(!storyblokApi\)/);
});
