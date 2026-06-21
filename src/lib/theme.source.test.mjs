import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const themeSource = readFileSync(new URL('./theme.ts', import.meta.url), 'utf8');

test('theme button cycling uses the single theme order helper', () => {
  assert.doesNotMatch(themeSource, /getThemeButtonOrder/);
  assert.doesNotMatch(themeSource, /THEME_BUTTON_ORDER/);

  const cycleBlock =
    themeSource.match(/export const getNextThemeForButtonCycle[\s\S]*?^};/m)?.[0] ||
    '';

  assert.match(cycleBlock, /const themeOrder = getThemeOrder\(orientation\)/);
  assert.doesNotMatch(cycleBlock, /themeButtonOrder/);
});
