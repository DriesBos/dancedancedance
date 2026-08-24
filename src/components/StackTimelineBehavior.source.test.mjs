import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./StackTimelineBehavior.tsx', import.meta.url), 'utf8');

test('stack timeline setup uses one root-scroll range contract', () => {
  assert.match(source, /data-stack-timeline-ready/);
  assert.match(source, /--stack-range-start/);
  assert.match(source, /--stack-range-end/);
  assert.match(source, /--stack-z/);
  assert.match(source, /const startPx = Math\.min\(window\.innerHeight \* 0\.2, maxScroll \* 0\.08\)/);
  assert.match(source, /rangeEnd = index === participants\.length - 1\s*\? 100/);
  assert.match(source, /CSS\.supports\('animation-timeline: scroll\(root block\)'\)/);
  assert.match(source, /participant\.style\.setProperty\(STACK_Z, String\(participants\.length - index\)\)/);
  assert.doesNotMatch(source, /stack-panel|PanelReceiver|assignPanelRange/);
});

test('stack timeline has no JavaScript scroll controller and cleans up after itself', () => {
  assert.doesNotMatch(source, /addEventListener\('scroll'/);
  assert.match(source, /fullscreen \|\| !isStackTimelinePath\(pathname\)/);
  assert.match(source, /clearTimeline\(main\)/);
  assert.match(source, /clearAssignments\(main\)/);
  assert.match(source, /participant\.style\.removeProperty\(STACK_Z\)/);
  assert.match(source, /new MutationObserver\(refresh\)/);
  assert.match(source, /document\.fonts\?\.ready\.then\(refresh\)/);
  assert.doesNotMatch(source, /resizeObserver\.observe\(document\.documentElement\)/);
});

test('eligible route changes keep the ready state while ranges rebuild', () => {
  const cleanup = source.match(/return \(\) => \{[\s\S]*?\n    \};/)?.[0] || '';

  assert.doesNotMatch(cleanup, /clearTimeline\(main\)/);
  assert.match(source, /if \(!main \|\| fullscreen \|\| !isStackTimelinePath\(pathname\)/);
});

test('home selects only direct intro/filter and real project rows', () => {
  assert.match(source, /:scope > \.blok-Intro, :scope > \.blok-Filter/);
  assert.match(source, /:scope > \.blok-ProjectList > \.blok-Project\[data-stack-item/);
  assert.match(source, /item\.offsetParent !== null/);
});
