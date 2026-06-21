import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readSource = (path) =>
  readFileSync(new URL(path, import.meta.url), 'utf8');

test('storyblok image prewarming is centralized and cache capped', () => {
  const imageSource = readSource('./storyblok-image.ts');
  const projectSliderSource = readSource(
    '../components/storyblok/BlokProjectSlider/BlokProjectSlider.tsx',
  );
  const columnSliderSource = readSource(
    '../components/storyblok/ColumnSlider.tsx',
  );

  assert.match(imageSource, /export const warmStoryblokImage/);
  assert.match(imageSource, /cacheLimit/);
  assert.match(imageSource, /capped/i);
  assert.match(imageSource, /new window\.Image\(\)/);

  for (const source of [projectSliderSource, columnSliderSource]) {
    assert.match(
      source,
      /warmStoryblokImage\([^,]+,[\s\S]*warmed[A-Za-z]+ImageSrcs,?\s*\)/,
    );
    assert.doesNotMatch(source, /new window\.Image\(\)/);
    assert.doesNotMatch(source, /image\.decode\?\.\(\)\.catch/);
  }
});
