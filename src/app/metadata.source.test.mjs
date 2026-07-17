import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const layoutSource = readFileSync(new URL('./layout.tsx', import.meta.url), 'utf8');
const pageSource = readFileSync(
  new URL('./[[...slug]]/page.tsx', import.meta.url),
  'utf8',
);
const sitemapSource = readFileSync(
  new URL('./sitemap.ts', import.meta.url),
  'utf8',
);
const projectCardSource = readFileSync(
  new URL('../components/BlokProject.tsx', import.meta.url),
  'utf8',
);
const projectPageSource = readFileSync(
  new URL('../components/storyblok/PageProject.tsx', import.meta.url),
  'utf8',
);

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

test('portfolio pages expose clear identity and crawl metadata', () => {
  assert.match(
    layoutSource,
    /Freelance Creative Developer & Web Designer \| Dries Bos/,
  );
  assert.match(layoutSource, /'@type': 'Person'/);
  assert.match(layoutSource, /'@type': 'WebSite'/);
  assert.match(layoutSource, /type="application\/ld\+json"/);
  assert.match(pageSource, /alternates: \{ canonical \}/);
  assert.match(pageSource, /component === 'Page Project'/);
  assert.match(pageSource, /<h1 className="visuallyHidden">/);
  assert.match(projectPageSource, /<article className="page page-Project"/);
});

test('Storyblok routes use full slugs and project cards expose real links', () => {
  assert.match(pageSource, /story\.full_slug \|\| story\.slug!/);
  assert.match(sitemapSource, /story\.full_slug \|\| story\.slug/);
  assert.doesNotMatch(sitemapSource, /lastModified: new Date\(\)/);
  assert.match(projectCardSource, /<Link href=\{href\}/);
});
