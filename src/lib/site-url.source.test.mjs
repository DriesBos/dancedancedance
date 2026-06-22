import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const siteUrlPath = new URL('./site-url.ts', import.meta.url);
const robotsSource = readFileSync(
  new URL('../app/robots.ts', import.meta.url),
  'utf8',
);
const sitemapSource = readFileSync(
  new URL('../app/sitemap.ts', import.meta.url),
  'utf8',
);
const layoutSource = readFileSync(
  new URL('../app/layout.tsx', import.meta.url),
  'utf8',
);

test('metadata, robots, and sitemap share the site URL helper', () => {
  assert.ok(existsSync(siteUrlPath));
  assert.match(layoutSource, /import \{ getSiteUrl \} from '@\/lib\/site-url';/);
  assert.match(robotsSource, /import \{ getSiteUrl \} from '@\/lib\/site-url';/);
  assert.match(sitemapSource, /import \{ getSiteUrl \} from '@\/lib\/site-url';/);
  assert.match(layoutSource, /metadataBase: new URL\(getSiteUrl\(\)\)/);
  assert.doesNotMatch(layoutSource, /NEXT_PUBLIC_SITE_URL/);
  assert.doesNotMatch(robotsSource, /const getSiteUrl =/);
  assert.doesNotMatch(sitemapSource, /const getSiteUrl =/);
});
