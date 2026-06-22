import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const nextConfigSource = readFileSync(new URL('../next.config.mjs', import.meta.url), 'utf8');
const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);
const gitignoreSource = readFileSync(new URL('../.gitignore', import.meta.url), 'utf8');
const eslintConfigSource = readFileSync(
  new URL('../eslint.config.mjs', import.meta.url),
  'utf8',
);

test('dev server uses a separate Next dist dir from production builds', () => {
  assert.match(nextConfigSource, /distDir:\s*process\.env\.NEXT_DIST_DIR\s*\|\|\s*['"]\.next['"]/);
  assert.match(packageJson.scripts.dev, /NEXT_DIST_DIR=\.next-dev/);
  assert.doesNotMatch(packageJson.scripts.build, /NEXT_DIST_DIR/);
  assert.match(gitignoreSource, /^\/\.next-dev\/$/m);
  assert.match(eslintConfigSource, /["']\.next-dev\/\*\*["']/);
});
