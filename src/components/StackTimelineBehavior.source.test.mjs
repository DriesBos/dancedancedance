import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./StackTimelineBehavior.tsx', import.meta.url), 'utf8');

test('stack timeline uses one weighted GSAP ScrollTrigger with delayed scrub', () => {
  assert.match(source, /data-stack-timeline-ready/);
  assert.match(source, /const STACK_SCRUB_SECONDS = 0\.66/);
  assert.match(source, /--stack-z/);
  assert.match(source, /const startPx = Math\.min\(window\.innerHeight \* 0\.2, maxScroll \* 0\.08\)/);
  assert.match(source, /rangeEnd =\s*index === participants\.length - 1\s*\? maxScroll/);
  assert.match(source, /const timeline = gsap\.timeline/);
  assert.match(source, /end: 'max'/);
  assert.match(source, /scrub: STACK_SCRUB_SECONDS/);
  assert.match(source, /participant\.style\.setProperty\(STACK_Z, String\(participants\.length - index\)\)/);
  assert.doesNotMatch(source, /stack-panel|PanelReceiver|assignPanelRange/);
});

test('stack timeline only rebuilds when the Home project-row roster changes', () => {
  assert.doesNotMatch(source, /addEventListener\('scroll'/);
  assert.match(source, /fullscreen \|\| !isStackTimelinePath\(pathname\)/);
  assert.match(source, /clearTimeline\(main\)/);
  assert.match(source, /clearAssignments\(main\)/);
  assert.match(source, /participant\.style\.removeProperty\(STACK_LIFT\)/);
  assert.match(source, /participant\.style\.removeProperty\(STACK_Z\)/);
  assert.match(source, /timeline\?\.scrollTrigger\?\.kill\(\)/);
  assert.match(source, /new MutationObserver\(refresh\)/);
  assert.match(source, /observer\.observe\(projectList, \{ childList: true \}\)/);
  assert.doesNotMatch(source, /subtree: true/);
  assert.doesNotMatch(source, /observer\.observe\(page/);
  assert.doesNotMatch(source, /observer\.observe\(main/);
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
