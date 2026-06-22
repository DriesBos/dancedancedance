import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const readRoot = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const existsRoot = (path) => existsSync(new URL(`../${path}`, import.meta.url));

test('verification scripts and CI cover source tests, build, typecheck, and audit', () => {
  const packageJson = JSON.parse(readRoot('package.json'));
  const workflow = readRoot('.github/workflows/lint.yml');

  assert.match(packageJson.scripts['test:source'], /node --test/);
  assert.match(packageJson.scripts.typecheck, /tsc --noEmit --pretty false/);
  assert.match(packageJson.scripts.check, /pnpm test:source/);
  assert.match(packageJson.scripts.check, /pnpm build/);
  assert.match(packageJson.scripts.check, /pnpm typecheck/);
  assert.match(packageJson.scripts.audit, /pnpm audit --prod --audit-level moderate/);

  assert.equal(packageJson.dependencies['react-swipeable'], undefined);
  assert.match(workflow, /node-version: 20/);
  assert.match(workflow, /run: pnpm check/);
  assert.match(workflow, /run: pnpm run audit/);
});

test('dependency overrides cover current transitive audit gaps', () => {
  const packageJson = JSON.parse(readRoot('package.json'));
  const overrides = packageJson.pnpm?.overrides ?? {};

  for (const key of [
    'postcss@<8.5.10',
    'markdown-it@<14.2.0',
    'mdast-util-to-hast@<13.2.1',
    'picomatch@<2.3.2',
    'picomatch@>=4.0.0 <4.0.4',
    'immutable@>=5.0.0 <5.1.5',
    'minimatch@<3.1.4',
    'minimatch@>=9.0.0 <9.0.7',
    'brace-expansion@<1.1.13',
    'brace-expansion@>=2.0.0 <2.0.3',
    'flatted@<=3.4.1',
    'js-yaml@<=4.1.1',
    'ajv@<6.14.0',
  ]) {
    assert.ok(overrides[key], `${key} override should exist`);
  }
});

test('retired slider, dither portrait, helper, fonts, and transition css are removed', () => {
  const storyblokSource = readRoot('src/lib/storyblok.ts');
  const layoutSource = readRoot('src/app/layout.tsx');
  const assetsImagesUrl = new URL('../src/assets/images', import.meta.url);
  const fontFiles = readdirSync(new URL('../src/assets/fonts', import.meta.url));

  assert.equal(existsRoot('src/components/storyblok/BlokProjectSlider'), false);
  assert.equal(existsRoot('src/components/DitheringVideoPortrait.tsx'), false);
  assert.equal(existsRoot('src/components/DitheringVideoPortrait.module.sass'), false);
  assert.equal(existsRoot('src/components/LazyDitheringVideoPortrait.tsx'), false);
  assert.equal(existsRoot('public/portraits/portrait_movie.mp4'), false);
  assert.equal(existsRoot('src/helpers/fetchData.tsx'), false);
  assert.equal(existsRoot('src/assets/styles/transitions.sass'), false);
  assert.doesNotMatch(layoutSource, /transitions\.sass/);
  assert.doesNotMatch(storyblokSource, /BlokProjectSlider/);
  assert.equal(
    existsSync(assetsImagesUrl) ? readdirSync(assetsImagesUrl).length : 0,
    0,
  );
  assert.deepEqual(fontFiles.sort(), ['soehne-web-buch.woff2']);
});

test('Netlify headers do not target deleted static assets', () => {
  const netlifySource = readRoot('netlify.toml');

  assert.doesNotMatch(netlifySource, /for = "\/\*\.woff"/);
  assert.doesNotMatch(netlifySource, /for = "\/\*\.eot"/);
  assert.doesNotMatch(netlifySource, /for = "\/favicon\.png"/);
  assert.doesNotMatch(netlifySource, /for = "\/icon\.png"/);
  assert.match(netlifySource, /for = "\/\*\.woff2"/);
  assert.match(netlifySource, /for = "\/og-image\.png"/);
});

test('project intentionally avoids reduced motion preference handling', () => {
  const agentsSource = readRoot('agents.md');
  const varsSource = readRoot('src/assets/styles/vars.sass');
  const scrollToTopSource = readRoot(
    'src/components/BlokFooter/ScrollToTopLink.tsx',
  );

  assert.match(
    agentsSource,
    /Do not add reduced motion preference handling \(`prefers-reduced-motion`\); this project intentionally keeps motion enabled unless the user explicitly asks otherwise\./,
  );
  assert.equal(existsRoot('src/lib/reduced-motion.ts'), false);
  assert.doesNotMatch(varsSource, /prefers-reduced-motion/);
  assert.doesNotMatch(scrollToTopSource, /reduced-motion/);
  assert.doesNotMatch(scrollToTopSource, /shouldApplyReducedMotion/);
});

test('published Storyblok story lists are fetched through the shared helper', () => {
  const helperSource = readRoot('src/lib/storyblok-stories.ts');
  const pageSource = readRoot('src/app/[[...slug]]/page.tsx');
  const sitemapSource = readRoot('src/app/sitemap.ts');

  assert.match(helperSource, /export async function fetchPublishedStoryList/);
  assert.match(helperSource, /getOptionalStoryblokApi/);
  assert.match(helperSource, /withPublishedStoryblokCv/);
  assert.match(pageSource, /fetchPublishedStoryList/);
  assert.match(sitemapSource, /fetchPublishedStoryList/);
  assert.doesNotMatch(pageSource, /storyblokApi\.get\(\s*['"`]cdn\/stories/);
  assert.doesNotMatch(sitemapSource, /storyblokApi\.get\(\s*['"`]cdn\/stories/);
});

test('Mux player uses lightweight thumbnails instead of client BlurUp generation', () => {
  const source = readRoot('src/components/MuxPlayer.tsx');

  assert.doesNotMatch(source, /@mux\/blurup/);
  assert.doesNotMatch(source, /createBlurUp/);
  assert.doesNotMatch(source, /blurDataURL/);
  assert.match(source, /const placeholderImage = poster/);
  assert.match(source, /placeholder=\{placeholderImage\}/);
});

test('performance telemetry is only mounted when explicitly enabled', () => {
  const layoutSource = readRoot('src/app/layout.tsx');

  assert.match(
    layoutSource,
    /const performanceTelemetryEnabled =\s*process\.env\.NEXT_PUBLIC_ENABLE_PERF_TELEMETRY === 'true'/,
  );
  assert.match(layoutSource, /performanceTelemetryEnabled \? \(/);
  assert.match(layoutSource, /<PerformanceTelemetry>/);
});
