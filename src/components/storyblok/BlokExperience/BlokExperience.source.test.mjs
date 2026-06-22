import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const styleSource = readFileSync(
  new URL('./BlokExperience.module.sass', import.meta.url),
  'utf8',
);
const componentSource = readFileSync(
  new URL('./BlokExperience.tsx', import.meta.url),
  'utf8',
);

test('mobile experience title keeps the same padding rhythm as stacked titles', () => {
  const blokNameBlock =
    styleSource.match(/\.blokName[\s\S]*?(?=\n\.content)/)?.[0] || '';

  assert.match(
    blokNameBlock,
    /@media \(max-width: 770px\)[\s\S]*padding: var\(--spacing-base\) var\(--spacing-side\)/,
  );
  assert.doesNotMatch(blokNameBlock, /padding-top: 0/);
});

test('experience blok renders Storyblok body content with editable attributes', () => {
  assert.match(componentSource, /storyblokEditable/);
  assert.match(componentSource, /StoryblokServerComponent/);
  assert.match(componentSource, /<h2[^>]*>Experience<\/h2>/);
  assert.match(componentSource, /blok\.body\.map/);
  assert.doesNotMatch(componentSource, /Dries Bos Studio|Mmerch|Anatha|Fotomat|Close My Eyes/);
});
