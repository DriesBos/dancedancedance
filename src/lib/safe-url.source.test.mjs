import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('./safe-url.ts', import.meta.url), 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`;
const { getSafeExternalHref } = await import(moduleUrl);

test('external hrefs allow only explicit safe protocols', () => {
  assert.equal(getSafeExternalHref('https://example.com'), 'https://example.com');
  assert.equal(getSafeExternalHref('http://example.com'), 'http://example.com');
  assert.equal(getSafeExternalHref('mailto:hello@example.com'), 'mailto:hello@example.com');

  assert.equal(getSafeExternalHref('javascript:alert(1)'), undefined);
  assert.equal(getSafeExternalHref('data:text/html,test'), undefined);
  assert.equal(getSafeExternalHref('/projects/test'), undefined);
  assert.equal(getSafeExternalHref('example.com'), undefined);
});
