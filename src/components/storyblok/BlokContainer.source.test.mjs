import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const blokContainerSource = readFileSync(
  new URL('./BlokContainer.tsx', import.meta.url),
  'utf8',
);
const rowSource = readFileSync(new URL('../Row.tsx', import.meta.url), 'utf8');
const globalStyleSource = readFileSync(
  new URL('../../assets/styles/global.sass', import.meta.url),
  'utf8',
);

test('BlokContainer exposes column behaviour while preserving wide columns fallback', () => {
  assert.match(
    blokContainerSource,
    /type ColumnBehaviour = 'none' \| 'hide-first' \| 'stack'/,
  );
  assert.match(blokContainerSource, /columnBehaviour\?: ColumnBehaviour/);
  assert.match(blokContainerSource, /wideColumns\?: boolean/);
  assert.match(
    blokContainerSource,
    /const columnBehaviour = blok\.columnBehaviour \|\| \(blok\.wideColumns \? 'stack' : 'none'\)/,
  );
  assert.match(blokContainerSource, /<Row columnBehaviour=\{columnBehaviour\}>/);
});

test('Row renders an explicit column behaviour data attribute', () => {
  assert.match(rowSource, /type ColumnBehaviour = 'none' \| 'hide-first' \| 'stack'/);
  assert.match(rowSource, /columnBehaviour\?: ColumnBehaviour/);
  assert.match(
    rowSource,
    /data-column-behaviour=\{columnBehaviour \|\| 'none'\}/,
  );
  assert.doesNotMatch(rowSource, /data-wide-columns/);
});

test('global styles define none, hide-first, and stack mobile column behaviours', () => {
  assert.match(globalStyleSource, /&\[data-column-behaviour='hide-first'\]/);
  assert.match(globalStyleSource, /& > div:first-child[\s\S]*display: none/);
  assert.match(globalStyleSource, /&\[data-column-behaviour='stack'\]/);
  assert.match(globalStyleSource, /flex-direction: column/);
  assert.doesNotMatch(globalStyleSource, /data-wide-columns/);
});

test('stacked rows keep desktop text columns visible on mobile', () => {
  const columnTextBlock =
    globalStyleSource.match(/&-Text\n[\s\S]*?&-TextExpandable/)?.[0] || '';

  assert.match(
    globalStyleSource,
    /&:not\(\[data-column-behaviour='stack'\]\)[\s\S]*\.column-Text\[data-display='desktop'\][\s\S]*display: none/,
  );
  assert.doesNotMatch(
    columnTextBlock,
    /&\[data-display='desktop'\][\s\S]*@media \(max-width: 770px\)[\s\S]*display: none/,
  );
});

test('fullscreen page border quieting only targets first-level page bloks', () => {
  const fullscreenTrueBlock =
    globalStyleSource.match(
      /&\[data-fullscreen="true"\][\s\S]*?&\[data-fullscreen="false"\]/,
    )?.[0] || '';

  assert.match(
    fullscreenTrueBlock,
    /\.page\n\s+&-Project,\n\s+&-General\n\s+& > \.blok\n\s+border-top-color: transparent\n\s+border-bottom-color: transparent/,
  );
  assert.doesNotMatch(
    fullscreenTrueBlock,
    /blok-ProjectList[\s\S]*border-(top|bottom)-color: transparent/,
  );
  assert.doesNotMatch(
    fullscreenTrueBlock,
    /\.blok\s+\.blok[\s\S]*border-(top|bottom)-color: transparent/,
  );
});
