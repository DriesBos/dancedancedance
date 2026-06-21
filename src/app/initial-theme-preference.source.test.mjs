import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const layoutSource = readFileSync(new URL('./layout.tsx', import.meta.url), 'utf8');

test('initial bootstrap theme uses color-scheme preference before time fallback', () => {
  assert.match(layoutSource, /prefers-color-scheme: dark/);
  assert.match(layoutSource, /var preferredTheme =/);
  assert.match(layoutSource, /preferredTheme === .*DARK/);
  assert.match(layoutSource, /hour >= 0 && hour < \$\{NIGHT_THEME_HOUR_END\}/);
  assert.doesNotMatch(layoutSource, /DEVELOPMENT_DEFAULT_THEME/);
  assert.doesNotMatch(layoutSource, /LANDSCAPE_DEFAULT_THEME/);
  assert.doesNotMatch(layoutSource, /PORTRAIT_DEFAULT_THEME/);
});
