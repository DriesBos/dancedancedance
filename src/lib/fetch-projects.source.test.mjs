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

test('project data has one Storyblok API caller and slug list derives from it', () => {
  assert.match(fetchProjectsSource, /export async function fetchProjectData/);
  assert.match(fetchProjectsSource, /if \(!storyblokApi\)/);
  assert.match(fetchProjectsSource, /export async function fetchProjectSlugs/);
  assert.match(fetchProjectsSource, /await fetchProjectData\(\)/);

  assert.doesNotMatch(projectsDataSource, /getStoryblokApi/);
  assert.doesNotMatch(projectsDataSource, /storyblokApi\.get/);
  assert.match(projectsDataSource, /from '@\/lib\/fetch-projects'/);
});
