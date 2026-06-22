import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readSource = (path) =>
  readFileSync(new URL(path, import.meta.url), 'utf8');

test('storyblok image prewarming is centralized and cache capped', () => {
  const imageSource = readSource('./storyblok-image.ts');
  const columnSliderSource = readSource(
    '../components/storyblok/ColumnSlider.tsx',
  );

  assert.match(imageSource, /export const warmStoryblokImage/);
  assert.match(imageSource, /cacheLimit/);
  assert.match(imageSource, /capped/i);
  assert.match(imageSource, /new window\.Image\(\)/);

  assert.match(
    columnSliderSource,
    /warmStoryblokImage\([^,]+,[\s\S]*warmed[A-Za-z]+ImageSrcs,?\s*\)/,
  );
  assert.doesNotMatch(columnSliderSource, /new window\.Image\(\)/);
  assert.doesNotMatch(columnSliderSource, /image\.decode\?\.\(\)\.catch/);
});
