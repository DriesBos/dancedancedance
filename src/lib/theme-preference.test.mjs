import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const themeSource = readFileSync(new URL('./theme.ts', import.meta.url), 'utf8');
const transpiledTheme = ts.transpileModule(themeSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

const themeModuleUrl = `data:text/javascript;base64,${Buffer.from(
  transpiledTheme,
).toString('base64')}`;
const theme = await import(themeModuleUrl);

test('initial theme follows color-scheme preference with a dark-night override', () => {
  assert.equal(theme.getDefaultTheme('light'), 'LIGHT');
  assert.equal(theme.getDefaultTheme('dark'), 'DARK');

  assert.equal(theme.getInitialThemeForHour(0, 'dark'), 'NIGHT');
  assert.equal(theme.getInitialThemeForHour(3, 'dark'), 'NIGHT');
  assert.equal(theme.getInitialThemeForHour(4, 'dark'), 'DARK');
  assert.equal(theme.getInitialThemeForHour(2, 'light'), 'LIGHT');
});

test('preferred color scheme is read from matchMedia with light fallback', () => {
  globalThis.window = {
    matchMedia: (query) => ({
      matches: query === '(prefers-color-scheme: dark)',
    }),
  };

  assert.equal(theme.getPreferredColorScheme(), 'dark');

  delete globalThis.window;
  assert.equal(theme.getPreferredColorScheme(), 'light');
});
