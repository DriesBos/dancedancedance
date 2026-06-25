import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const layoutSource = readFileSync(new URL('./layout.tsx', import.meta.url), 'utf8');
const appInitializerSource = readFileSync(
  new URL('../components/AppInitStore.tsx', import.meta.url),
  'utf8',
);
const storeSource = readFileSync(
  new URL('../store/store.tsx', import.meta.url),
  'utf8',
);
const headRouteContentContainerSource = readFileSync(
  new URL('../components/BlokHead/BlokHeadRouteContentContainer.tsx', import.meta.url),
  'utf8',
);

test('initial bootstrap theme uses color-scheme preference before time fallback', () => {
  assert.match(layoutSource, /prefers-color-scheme: dark/);
  assert.match(layoutSource, /var preferredTheme =/);
  assert.match(layoutSource, /preferredTheme === .*DARK/);
  assert.match(layoutSource, /hour >= 0 && hour < \$\{NIGHT_THEME_HOUR_END\}/);
  assert.doesNotMatch(layoutSource, /DEVELOPMENT_DEFAULT_THEME/);
  assert.doesNotMatch(layoutSource, /LANDSCAPE_DEFAULT_THEME/);
  assert.doesNotMatch(layoutSource, /PORTRAIT_DEFAULT_THEME/);
  assert.doesNotMatch(layoutSource, /initialThemeIntroPending/);
  assert.doesNotMatch(layoutSource, /THEMES_WITH_INITIAL_INTRO/);
});

test('fullscreen bootstrap uses mobile default and desktop browser preference', () => {
  assert.match(layoutSource, /var isMobile =/);
  assert.match(layoutSource, /max-width: 770px/);
  assert.match(layoutSource, /localStorage\.getItem\('ddd-fullscreen'\)/);
  assert.match(layoutSource, /try \{[\s\S]*localStorage\.getItem\('ddd-fullscreen'\)[\s\S]*\} catch \{\}/);
  assert.match(layoutSource, /var fullscreen = isMobile \? true : storedFullscreenPreference === 'true'/);
  assert.match(layoutSource, /data-fullscreen', String\(fullscreen\)/);

  assert.match(appInitializerSource, /const FULLSCREEN_STORAGE_KEY = 'ddd-fullscreen';/);
  assert.match(appInitializerSource, /const getInitialFullscreen = /);
  assert.match(appInitializerSource, /max-width: 770px/);
  assert.match(appInitializerSource, /window\.localStorage\.getItem\(FULLSCREEN_STORAGE_KEY\)/);
  assert.match(appInitializerSource, /catch \{\n\s+return null;\n\s+\}/);
  assert.match(appInitializerSource, /getIsMobileViewport\(\) \? true : getStoredFullscreenPreference\(\) === 'true'/);
  assert.match(appInitializerSource, /fullscreen: getInitialFullscreen\(\)/);

  assert.match(headRouteContentContainerSource, /const FULLSCREEN_STORAGE_KEY = 'ddd-fullscreen';/);
  assert.match(headRouteContentContainerSource, /const isMobileViewport = getIsMobileViewport\(\);/);
  assert.match(headRouteContentContainerSource, /const nextFullscreen = isMobileViewport \? true : !fullscreen;/);
  assert.match(headRouteContentContainerSource, /window\.localStorage\.setItem\(FULLSCREEN_STORAGE_KEY, String\(fullscreen\)\)/);
  assert.match(headRouteContentContainerSource, /if \(!isMobileViewport\) \{\n\s+setStoredFullscreenPreference\(nextFullscreen\);\n\s+\}/);
});

test('store defaults stay stable for the first hydration render', () => {
  assert.match(storeSource, /theme: LIGHT_THEME/);
  assert.match(storeSource, /fullscreen: false/);
  assert.doesNotMatch(storeSource, /persist\(/);
  assert.doesNotMatch(storeSource, /__DDD_INITIAL_STATE__/);
  assert.doesNotMatch(storeSource, /typeof window/);
});
