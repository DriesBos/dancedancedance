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

test('mobile head animation uses coarse-pointer media and a 1s replay delay', () => {
  assert.match(
    behaviorSource,
    /MOBILE_HEAD_ANIMATION_MEDIA_QUERY\s*=\s*'\(hover: none\), \(pointer: coarse\)'/,
  );
  assert.match(behaviorSource, /MOBILE_HEAD_ANIMATION_DELAY\s*=\s*1000/);
});

test('mobile head animation replays when the tab becomes visible or focused', () => {
  assert.match(behaviorSource, /document\.addEventListener\('visibilitychange'/);
  assert.match(behaviorSource, /window\.addEventListener\('focus'/);
  assert.match(behaviorSource, /document\.hidden/);
});

test('BlokHead renders one direct main child without a sentinel sibling', () => {
  assert.doesNotMatch(behaviorSource, /headSentinelRef/);
  assert.doesNotMatch(behaviorSource, /new IntersectionObserver/);
  assert.doesNotMatch(headSource, /headSentinelRef/);
  assert.doesNotMatch(headSource, /className=\{styles\.headSentinel\}/);
  assert.doesNotMatch(headStyleSource, /\.headSentinel/);
  assert.match(headSource, /return \(\s*<div[\s\S]*className=\{`\$\{styles\.blokHead\} blok blok-Head blok-AnimateHead`\}/);
});

test('touch-to-open behavior is disabled while the mobile animation owns head movement', () => {
  assert.match(
    behaviorSource,
    /if \(!isThreeDLayout \|\| isMobileHeadAnimationLayout\) return;/,
  );
});

test('head owns an explicit surface state separate from panel state', () => {
  assert.match(headSource, /data-surface="transparent"/);
  assert.match(behaviorSource, /type HeadSurface = 'transparent' \| 'solid'/);
  assert.match(behaviorSource, /const setHeadSurface = useCallback/);
});

test('mobile replay no longer depends on sentinel-specific scrolled state', () => {
  assert.doesNotMatch(behaviorSource, /isHeadSentinelVisible/);
  assert.doesNotMatch(behaviorSource, /moveMobileHeadDown\('forcedClosed', 'solid'\)/);
  assert.match(behaviorSource, /moveMobileHeadDown\('closed', 'transparent'\)/);
  assert.match(behaviorSource, /setHeadSurface\('transparent'\)/);
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
