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

test('mobile head animation uses a stable sentinel instead of observing the transformed head', () => {
  assert.match(behaviorSource, /headSentinelRef/);
  assert.match(behaviorSource, /new IntersectionObserver/);
  assert.match(headSource, /headSentinelRef/);
  assert.match(headSource, /className=\{styles\.headSentinel\}/);
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

test('mobile scrolled head uses solid surface while at-top replay uses transparent surface', () => {
  assert.match(
    behaviorSource,
    /moveMobileHeadDown\('forcedClosed', 'solid'\)/,
  );
  assert.match(behaviorSource, /moveMobileHeadDown\('closed', 'transparent'\)/);
  assert.match(behaviorSource, /setHeadSurface\('transparent'\)/);
});

test('head surface CSS controls background without changing side panel transparency', () => {
  assert.match(headStyleSource, /&\[data-surface='transparent'\][\s\S]*background: transparent/);
  assert.match(headStyleSource, /&\[data-surface='solid'\][\s\S]*background: var\(--theme-blok\)/);
  assert.match(headStyleSource, /&\[data-surface='solid'\][\s\S]*& > :global\(\.grainyGradient\)[\s\S]*opacity: var\(--theme-bg-gradient\)/);
});
