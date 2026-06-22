import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readSource = (path) =>
  readFileSync(new URL(path, import.meta.url), 'utf8');

test('Storyblok image dimensions are parsed centrally and used by image bloks', () => {
  const imageHelperSource = readSource('./storyblok-image.ts');
  const columnImageSource = readSource('../components/storyblok/ColumnImage.tsx');
  const columnSliderSource = readSource('../components/storyblok/ColumnSlider.tsx');

  assert.match(imageHelperSource, /export const parseStoryblokImageDimensions/);
  assert.match(imageHelperSource, /STORYBLOK_IMAGE_DIMENSIONS_PATTERN/);
  assert.match(imageHelperSource, /const width = Number/);
  assert.match(imageHelperSource, /const height = Number/);
  assert.match(imageHelperSource, /STORYBLOK_FALLBACK_IMAGE_DIMENSIONS/);

  assert.match(columnImageSource, /parseStoryblokImageDimensions/);
  assert.match(columnSliderSource, /parseStoryblokImageDimensions/);
  assert.match(columnImageSource, /transformStoryblokImageUrl/);
  assert.match(columnSliderSource, /transformStoryblokImageUrl/);
  assert.match(columnImageSource, /unoptimized/);
  assert.match(columnSliderSource, /unoptimized/);
  assert.doesNotMatch(imageHelperSource, /ImageLoaderProps/);
  assert.doesNotMatch(imageHelperSource, /export const storyblokImageLoader/);
  assert.doesNotMatch(columnImageSource, /loader=\{storyblokImageLoader\}/);
  assert.doesNotMatch(columnSliderSource, /loader=\{storyblokImageLoader\}/);
  assert.doesNotMatch(columnImageSource, /width=\{0\}/);
  assert.doesNotMatch(columnImageSource, /height=\{0\}/);
  assert.doesNotMatch(columnSliderSource, /width=\{0\}/);
  assert.doesNotMatch(columnSliderSource, /height=\{0\}/);
});
