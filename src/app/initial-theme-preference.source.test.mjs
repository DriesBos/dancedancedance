import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const layoutSource = readFileSync(new URL('./layout.tsx', import.meta.url), 'utf8');
const appInitializerSource = readFileSync(
  new URL('../components/AppInitStore.tsx', import.meta.url),
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

test('mobile devices start with fullscreen enabled before React hydrates', () => {
  assert.match(layoutSource, /var isMobile =/);
  assert.match(layoutSource, /max-width: 770px/);
  assert.match(layoutSource, /var fullscreen = isMobile/);
  assert.match(layoutSource, /data-fullscreen', String\(fullscreen\)/);

  assert.match(appInitializerSource, /const getInitialFullscreen = /);
  assert.match(appInitializerSource, /max-width: 770px/);
  assert.match(appInitializerSource, /fullscreen: getInitialFullscreen\(\)/);
});
