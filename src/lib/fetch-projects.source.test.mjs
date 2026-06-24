import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const fetchProjectsSource = readFileSync(
  new URL('./fetch-projects.ts', import.meta.url),
  'utf8',
);
const projectsDataSource = readFileSync(
  new URL('../components/storyblok/projectsData.ts', import.meta.url),
  'utf8',
);
const storyblokStoriesSource = readFileSync(
  new URL('./storyblok-stories.ts', import.meta.url),
  'utf8',
);

test('project data has one Storyblok API caller and slug list derives from it', () => {
  assert.match(fetchProjectsSource, /export async function fetchProjectData/);
  assert.match(fetchProjectsSource, /thumbnail_new\?: ProjectData\['thumbnail'\]/);
  assert.match(fetchProjectsSource, /const getPreferredThumbnail = /);
  assert.match(fetchProjectsSource, /content\.thumbnail_new\?\.filename \? content\.thumbnail_new : content\.thumbnail/);
  assert.match(fetchProjectsSource, /thumbnail: getPreferredThumbnail\(story\.content\)/);
  assert.match(fetchProjectsSource, /fetchPublishedStoryList/);
  assert.doesNotMatch(fetchProjectsSource, /storyblokApi\.get/);
  assert.match(fetchProjectsSource, /export async function fetchProjectSlugs/);
  assert.match(fetchProjectsSource, /await fetchProjectData\(\)/);
  assert.match(storyblokStoriesSource, /getOptionalStoryblokApi/);
  assert.match(storyblokStoriesSource, /if \(!storyblokApi\)/);

  assert.doesNotMatch(projectsDataSource, /getStoryblokApi/);
  assert.doesNotMatch(projectsDataSource, /storyblokApi\.get/);
  assert.match(projectsDataSource, /from '@\/lib\/fetch-projects'/);
});
