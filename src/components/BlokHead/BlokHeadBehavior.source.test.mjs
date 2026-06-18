import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const behaviorSource = readFileSync(
  new URL('./BlokHeadBehavior.tsx', import.meta.url),
  'utf8',
);
const headSource = readFileSync(new URL('./BlokHead.tsx', import.meta.url), 'utf8');

test('mobile head animation uses coarse-pointer media and a 330ms replay delay', () => {
  assert.match(
    behaviorSource,
    /MOBILE_HEAD_ANIMATION_MEDIA_QUERY\s*=\s*'\(hover: none\), \(pointer: coarse\)'/,
  );
  assert.match(behaviorSource, /MOBILE_HEAD_ANIMATION_DELAY\s*=\s*330/);
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
