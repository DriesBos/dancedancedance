import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const behaviorSource = readFileSync(
  new URL('./BlokHeadBehavior.tsx', import.meta.url),
  'utf8',
);
const headSource = readFileSync(new URL('./BlokHead.tsx', import.meta.url), 'utf8');
const headStyleSource = readFileSync(
  new URL('./BlokHead.module.sass', import.meta.url),
  'utf8',
);
const globalStyleSource = readFileSync(
  new URL('../../assets/styles/global.sass', import.meta.url),
  'utf8',
);
const storeSource = readFileSync(new URL('../../store/store.tsx', import.meta.url), 'utf8');
const headerInitSource = readFileSync(
  new URL('../HeaderInitAnimation.tsx', import.meta.url),
  'utf8',
);

test('head active state is local and CSS-driven', () => {
  assert.match(headSource, /data-active="false"/);
  assert.doesNotMatch(headSource, /data-forced-closed/);
  assert.doesNotMatch(headSource, /data-scrollborder/);
  assert.match(headStyleSource, /&\[data-active='true'\] \.blokHead[\s\S]*transform: translateY\(calc\(var\(--head-intro-y\) - 100%\)\)/);
  assert.doesNotMatch(behaviorSource, /gsap\.to\(headRef\.current/);
  assert.doesNotMatch(behaviorSource, /gsap\.set\(headRef\.current/);
  assert.doesNotMatch(behaviorSource, /yPercent/);
  assert.doesNotMatch(behaviorSource, /setTopPanel/);
  assert.doesNotMatch(behaviorSource, /topPanel:/);
  assert.doesNotMatch(storeSource, /topPanel/);
});

test('header intro animation composes with active transform through a CSS variable', () => {
  assert.match(headStyleSource, /--head-intro-y: 0px/);
  assert.match(headStyleSource, /transform: translateY\(var\(--head-intro-y\)\)/);
  assert.match(headerInitSource, /'--head-intro-y': '5vh'/);
  assert.match(headerInitSource, /'--head-intro-y': '0vh'/);
  assert.doesNotMatch(headerInitSource, /\by:\s*'5vh'/);
  assert.doesNotMatch(headerInitSource, /\by:\s*0/);
});

test('BlokHead renders one direct main child without a sentinel sibling', () => {
  assert.doesNotMatch(behaviorSource, /headSentinelRef/);
  assert.doesNotMatch(behaviorSource, /new IntersectionObserver/);
  assert.doesNotMatch(headSource, /headSentinelRef/);
  assert.doesNotMatch(headSource, /className=\{styles\.headSentinel\}/);
  assert.doesNotMatch(headStyleSource, /\.headSentinel/);
  assert.match(headSource, /return \(\s*<div[\s\S]*className=\{`\$\{styles\.blokHeadFrame\} blok blok-Head blok-AnimateHead`\}/);
});

test('BlokHead measures a stable frame while the inner visual surface moves', () => {
  assert.match(headSource, /ref=\{headRef\}[\s\S]*className=\{`\$\{styles\.blokHeadFrame\} blok blok-Head blok-AnimateHead`\}/);
  assert.match(headSource, /<div className=\{styles\.blokHead\}>[\s\S]*<GrainyGradient variant="blok" \/>/);
  assert.match(headStyleSource, /\.blokHeadFrame[\s\S]*height: calc\(var\(--blok-height\) \+ 2 \* var\(--border-width\)\)/);
  assert.match(headStyleSource, /\.blokHeadFrame[\s\S]*border-color: transparent/);
  assert.match(headStyleSource, /\.blokHeadFrame[\s\S]*&\[data-active='true'\] \.blokHead[\s\S]*transform: translateY\(calc\(var\(--head-intro-y\) - 100%\)\)/);
  assert.match(headStyleSource, /\.blokHead[\s\S]*position: absolute[\s\S]*inset: calc\(0px - var\(--border-width\)\)/);
  assert.match(headStyleSource, /\.blokHead[\s\S]*transform: translateY\(var\(--head-intro-y\)\)/);
});

test('head owns an explicit surface state separate from panel state', () => {
  assert.match(headSource, /data-surface="transparent"/);
  assert.match(behaviorSource, /type HeadSurface = 'transparent' \| 'solid'/);
  assert.match(behaviorSource, /const setHeadSurface = useCallback/);
});

test('sticky or fullscreen geometry decides whether scroll owns active', () => {
  assert.match(behaviorSource, /const getIsSticky = useCallback/);
  assert.match(behaviorSource, /window\.scrollY > 0/);
  assert.doesNotMatch(behaviorSource, /const STICKY_TOP_OFFSET/);
  assert.doesNotMatch(behaviorSource, /const STICKY_TOP_EPSILON/);
  assert.match(behaviorSource, /getBoundingClientRect\(\)\.top <= 1/);
  assert.match(behaviorSource, /const scrollOwnsActive = fullscreen \|\| getIsSticky\(\)/);
  assert.match(behaviorSource, /scrollOwnsActive\s*\?\s*scrollActiveRef\.current\s*:\s*interactionActiveRef\.current/);
});

test('sticky scroll controller keeps a symmetric 10vh threshold', () => {
  assert.match(behaviorSource, /const SCROLL_DIRECTION_THRESHOLD_RATIO = 0\.1/);
  assert.match(behaviorSource, /window\.innerHeight \* SCROLL_DIRECTION_THRESHOLD_RATIO/);
  assert.match(behaviorSource, /scrollingDown[\s\S]*setScrollActive\(true\)/);
  assert.match(behaviorSource, /!scrollingDown[\s\S]*setScrollActive\(false\)/);
});

test('mobile has no separate timer replay controller', () => {
  assert.doesNotMatch(behaviorSource, /MOBILE_HEAD_ANIMATION/);
  assert.doesNotMatch(behaviorSource, /visibilitychange/);
  assert.doesNotMatch(behaviorSource, /window\.addEventListener\('focus'/);
  assert.doesNotMatch(behaviorSource, /setTimeout/);
});

test('head surface CSS controls background without changing side panel transparency', () => {
  assert.match(headStyleSource, /&\[data-surface='transparent'\][\s\S]*background: transparent/);
  assert.match(headStyleSource, /&\[data-surface='solid'\][\s\S]*background: var\(--theme-blok\)/);
  assert.match(headStyleSource, /&\[data-surface='solid'\][\s\S]*& > :global\(\.grainyGradient\)[\s\S]*opacity: var\(--theme-bg-gradient\)/);
});

test('fullscreen-off head keeps its transparent top panel visible for borders', () => {
  const fullscreenFalseHeadBlock =
    globalStyleSource.match(
      /&\[data-fullscreen="false"\][\s\S]*?&-Project/,
    )?.[0] || '';

  assert.match(fullscreenFalseHeadBlock, /&-Head[\s\S]*\.side_Top[\s\S]*opacity: 1/);
});

test('layout targets the head blok explicitly instead of by child index', () => {
  assert.match(globalStyleSource, /& > \.blok-Head[\s\S]*\.side_Top[\s\S]*opacity: 1/);
  assert.doesNotMatch(globalStyleSource, /&:nth-child\(2\)[\s\S]*z-index: -1/);
});

test('header row stays above the visible transparent top panel for clicks', () => {
  assert.match(headStyleSource, /\.row[\s\S]*position: relative/);
  assert.match(headStyleSource, /\.row[\s\S]*z-index: 2/);
});
