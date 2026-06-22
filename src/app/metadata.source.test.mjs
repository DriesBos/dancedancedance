import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const layoutSource = readFileSync(new URL('./layout.tsx', import.meta.url), 'utf8');

test('root OpenGraph metadata declares complete sharing fields', () => {
  const openGraphSource =
    layoutSource.match(/openGraph: \{[\s\S]*?\n  \},\n  twitter:/)?.[0] || '';
  const imageSource =
    openGraphSource.match(/images: \[[\s\S]*?\n    \],/)?.[0] || '';

  assert.match(openGraphSource, /type: 'website'/);
  assert.match(openGraphSource, /url: '\/'/);
  assert.match(openGraphSource, /siteName: 'Dries Bos'/);
  assert.match(openGraphSource, /locale: 'en_US'/);
  assert.match(imageSource, /width: 1200/);
  assert.match(imageSource, /height: 630/);
  assert.match(imageSource, /type: 'image\/png'/);
});
