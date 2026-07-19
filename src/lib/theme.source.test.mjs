import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const themeSource = readFileSync(new URL('./theme.ts', import.meta.url), 'utf8');

test('theme button cycling uses one theme order', () => {
  assert.doesNotMatch(themeSource, /getThemeButtonOrder/);
  assert.doesNotMatch(themeSource, /THEME_BUTTON_ORDER/);

  const cycleBlock =
    themeSource.match(/export const getNextThemeForButtonCycle[\s\S]*?^};/m)?.[0] ||
    '';

  assert.match(themeSource, /export const THEME_ORDER: Theme\[\]/);
  assert.match(cycleBlock, /THEME_ORDER\.indexOf\(currentTheme\)/);
  assert.doesNotMatch(themeSource, /LANDSCAPE_THEME_ORDER|PORTRAIT_THEME_ORDER|ThemeOrientation/);
});
