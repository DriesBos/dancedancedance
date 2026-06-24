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

test('global styles hide scrollbars across browser engines', () => {
  assert.match(
    globalStyleSource,
    /\*\n\s+cursor: none !important\n\s+scrollbar-width: none\n\s+-ms-overflow-style: none/,
  );
  assert.match(globalStyleSource, /&::-webkit-scrollbar\n\s+display: none/);
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

test('fullscreen project media runs collapse only adjacent media column padding', () => {
  const fullscreenTrueBlock =
    globalStyleSource.match(
      /&\[data-fullscreen="true"\][\s\S]*?&\[data-fullscreen="false"\]/,
    )?.[0] || '';

  assert.match(
    fullscreenTrueBlock,
    /\.page-Project[\s\S]*& > \.blok:has\(> \.row > :where\(\.column-Image, \.column-Video, \.column-Slider\)\):has\(\+ \.blok:has\(> \.row > :where\(\.column-Image, \.column-Video, \.column-Slider\)\)\)/,
  );
  assert.match(
    fullscreenTrueBlock,
    /padding-bottom: 0/,
  );
  assert.match(
    fullscreenTrueBlock,
    /& > \.blok:has\(> \.row > :where\(\.column-Image, \.column-Video, \.column-Slider\)\) \+ \.blok:has\(> \.row > :where\(\.column-Image, \.column-Video, \.column-Slider\)\)/,
  );
  assert.match(
    fullscreenTrueBlock,
    /padding-top: 0/,
  );
  assert.doesNotMatch(
    fullscreenTrueBlock,
    /data-media-rhythm|data-project-media-sequence/,
  );
});

test('fullscreen mobile stacked media columns keep an inner gap', () => {
  const fullscreenTrueBlock =
    globalStyleSource.match(
      /&\[data-fullscreen="true"\][\s\S]*?&\[data-fullscreen="false"\]/,
    )?.[0] || '';

  assert.match(
    fullscreenTrueBlock,
    /@media \(max-width: 770px\)\n\s+\.page-Project \.row\[data-column-behaviour='stack'\]:has\(> :where\(\.column-Image, \.column-Video, \.column-Slider\):first-child\):has\(> :where\(\.column-Image, \.column-Video, \.column-Slider\):nth-child\(2\)\)/,
  );
  assert.match(
    fullscreenTrueBlock,
    /& > :where\(\.column-Image, \.column-Video, \.column-Slider\):first-child\n\s+padding-bottom: var\(--spacing-side-image\)/,
  );
  assert.doesNotMatch(
    fullscreenTrueBlock,
    /data-stack-media|data-stacked-media|data-media-gap/,
  );
});

test('mobile media caption padding only applies outside fullscreen', () => {
  const mediaColumnBlock =
    globalStyleSource.match(
      /&-Image, &-Thumbnail, &-Video, &-Slider[\s\S]*?&-Slider\n\s+&-Stack/,
    )?.[0] || '';
  const fullscreenFalseBlock =
    globalStyleSource.match(
      /&\[data-fullscreen="false"\][\s\S]*?&\[data-theme='NIGHT'\]/,
    )?.[0] || '';

  assert.match(
    fullscreenFalseBlock,
    /@media \(max-width: 770px\)\n\s+\.blok \.row > :where\(\.column-Image, \.column-Thumbnail, \.column-Video, \.column-Slider\)\n\s+\.column-Caption\n\s+padding: var\(--spacing-base\)\n\s+padding-top: 0/,
  );
  assert.doesNotMatch(
    mediaColumnBlock,
    /@media \(max-width: 770px\)[\s\S]*\.column-Caption\s+padding: var\(--spacing-base\)/,
  );
});

test('project list contains the final project row overlap', () => {
  const projectListBlock =
    globalStyleSource.match(/&-ProjectList\n[\s\S]*?&-Filter/)?.[0] || '';

  assert.match(
    projectListBlock,
    /padding-bottom: calc\(3\.95rem \* 0\.5\)/,
  );
});
