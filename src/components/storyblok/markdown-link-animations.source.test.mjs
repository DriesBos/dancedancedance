import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const readSource = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('column text clients share the markdown link animation hook', () => {
  const hookUrl = new URL('../TheMarkdown/useMarkdownLinkAnimations.ts', import.meta.url);
  assert.equal(existsSync(hookUrl), true);

  const hookSource = readFileSync(hookUrl, 'utf8');
  const columnTextSource = readSource('./ColumnTextClient.tsx');
  const expandableSource = readSource('./ColumnTextExpandableClient.tsx');

  assert.match(hookSource, /export const useMarkdownLinkAnimations/);
  assert.match(hookSource, /useGSAP\(/);
  assert.match(hookSource, /--markdown-underline-progress/);

  for (const source of [columnTextSource, expandableSource]) {
    assert.match(
      source,
      /import \{ useMarkdownLinkAnimations \} from '@\/components\/TheMarkdown\/useMarkdownLinkAnimations';/,
    );
    assert.match(source, /useMarkdownLinkAnimations\(container\);/);
    assert.doesNotMatch(source, /useGSAP\(/);
    assert.doesNotMatch(source, /gsap\./);
    assert.doesNotMatch(source, /--markdown-underline-progress/);
  }
});
