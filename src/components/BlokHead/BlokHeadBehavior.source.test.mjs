import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const behaviorSource = readFileSync(
  new URL('./BlokHeadBehavior.tsx', import.meta.url),
  'utf8',
);
const headSource = readFileSync(new URL('./BlokHead.tsx', import.meta.url), 'utf8');
const routeContentSource = readFileSync(
  new URL('./BlokHeadRouteContent.tsx', import.meta.url),
  'utf8',
);
const headStyleSource = readFileSync(
  new URL('./BlokHead.module.sass', import.meta.url),
  'utf8',
);
const sidePanelStyleSource = readFileSync(
  new URL('../BlokSidePanels/BlokSidePanels.module.sass', import.meta.url),
  'utf8',
);
const globalStyleSource = readFileSync(
  new URL('../../assets/styles/global.sass', import.meta.url),
  'utf8',
);
const varsStyleSource = readFileSync(
  new URL('../../assets/styles/vars.sass', import.meta.url),
  'utf8',
);
const storeSource = readFileSync(new URL('../../store/store.tsx', import.meta.url), 'utf8');
const headerInitSource = readFileSync(
  new URL('../HeaderInitAnimation.tsx', import.meta.url),
  'utf8',
);
const pageTransitionSource = readFileSync(
  new URL('../PageTransition.tsx', import.meta.url),
  'utf8',
);

test('head active state is local and CSS-driven', () => {
  assert.match(headSource, /data-active="false"/);
  assert.doesNotMatch(headSource, /data-forced-closed/);
  assert.doesNotMatch(headSource, /data-scrollborder/);
  assert.match(
    headStyleSource,
    /body\[data-fullscreen='true'\][^\n]*&\[data-active='true'\] \.blokHead[\s\S]*transform: translateY\(-100%\)/,
  );
  assert.doesNotMatch(behaviorSource, /gsap\.to\(headRef\.current/);
  assert.doesNotMatch(behaviorSource, /gsap\.set\(headRef\.current/);
  assert.doesNotMatch(behaviorSource, /yPercent/);
  assert.doesNotMatch(behaviorSource, /setTopPanel/);
  assert.doesNotMatch(behaviorSource, /topPanel:/);
  assert.doesNotMatch(storeSource, /topPanel/);
});

test('entry animations fade complete blok surfaces and move page bloks up', () => {
  assert.doesNotMatch(headStyleSource, /--head-intro-y/);
  assert.match(headStyleSource, /transform: translateY\(0\)/);
  assert.doesNotMatch(
    headStyleSource,
    /^\s*&\[data-active='true'\] \.blokHead/m,
  );
  assert.doesNotMatch(headerInitSource, /gsap/);
  // Page bloks fade in and move up from CSS, so the entrance starts at first
  // paint rather than at hydration. PageTransition only replays it.
  assert.match(
    globalStyleSource,
    /@keyframes blokEnter\n\s+from\n\s+opacity: \.001\n\s+transform: translateY\(5vh\)\n\s+to\n\s+opacity: 1\n\s+transform: none/,
  );
  assert.match(
    globalStyleSource,
    /&-Animate\n\s+opacity: 0\n(?:\s+\/\/[^\n]*\n)*\s+--blok-enter-delay: \.35s\n\s+animation: blokEnter 1s cubic-bezier\(\.16, 1, \.3, 1\) both\n\s+animation-delay: var\(--blok-enter-delay\)/,
  );
  // The header is slot 0 of the same shared entrance keyframe.
  assert.match(
    globalStyleSource,
    /&-AnimateHead\n\s+opacity: 0\n(?:\s+\/\/[^\n]*\n)*\s+animation: blokEnter 1s cubic-bezier\(\.16, 1, \.3, 1\) both\n\s+animation-delay: \.2s/,
  );
  assert.match(
    globalStyleSource,
    /body\[data-entrance-done='true'\] \.blok-Animate\n\s+--blok-enter-delay: 0s/,
  );
  assert.match(
    globalStyleSource,
    /\.page > \.blok-Animate:nth-child\(#\{\$i\} of \.blok-Animate\)\n\s+animation-delay: calc\(var\(--blok-enter-delay\) \+ #\{\(\$i - 1\) \* 0\.15\}s\)/,
  );
  assert.match(
    globalStyleSource,
    /\.page:not\(\[style\*='display: none'\]\):has\(> \.blok-Animate:nth-child\(#\{\$i\} of \.blok-Animate\)\) ~ \.blok-Animate\n\s+animation-delay: calc\(var\(--blok-enter-delay\) \+ #\{\$i \* 0\.15\}s\)/,
  );
  assert.doesNotMatch(pageTransitionSource, /gsap/);
  assert.match(
    pageTransitionSource,
    /querySelectorAll<HTMLElement>\('\.blok-Animate'\)/,
  );
  assert.match(
    pageTransitionSource,
    /animationName !== ENTRANCE_ANIMATION[\s\S]*animation\.cancel\(\);\n\s+animation\.play\(\);/,
  );
  assert.match(pageTransitionSource, /\}, \[pathname, theme\]\);/);
  // The entrance must not replay while hydration is still settling: guard on
  // the last committed route and the theme that <body> already painted with.
  assert.doesNotMatch(pageTransitionSource, /hasPlayedInitialEntrance/);
  assert.match(
    pageTransitionSource,
    /let lastEntrance: \{ pathname: string; theme: string \} \| null = null/,
  );
  assert.match(
    pageTransitionSource,
    /const committed = \{ pathname, theme: document\.body\?\.dataset\.theme \?\? '' \};\n\s+const previous = lastEntrance;\n\s+lastEntrance = committed;/,
  );
  assert.match(
    pageTransitionSource,
    /!previous \|\|\n\s+\(previous\.pathname === committed\.pathname && previous\.theme === committed\.theme\)/,
  );
  // On a real replay (not the initial run), flag <body> so global.sass can
  // drop the header's base delay for the new page's bloks and footer — that
  // delay only exists to give the header slot 0 on initial load.
  assert.match(
    pageTransitionSource,
    /return;\n\s+\}\n\n\s+document\.body\.dataset\.entranceDone = 'true';\n\n\s+const blockTargets/,
  );
  assert.doesNotMatch(pageTransitionSource, /getBlockContentTargets|contentTargets/);
  // HeaderInitAnimation no longer animates anything itself: it waits for the
  // CSS-driven `blokEnter` animation on the header frame to finish, then
  // flips the body flags. The promise-based `.finished` handshake (not an
  // `animationend` listener) covers hydration landing after the animation
  // already ended.
  assert.match(headerInitSource, /const ENTRANCE_ANIMATION = 'blokEnter'/);
  assert.match(
    headerInitSource,
    /\.getAnimations\(\)\s*\n\s*\.find\(\(a\)[\s\S]*?a as CSSAnimation\)\.animationName === ENTRANCE_ANIMATION\)/,
  );
  assert.match(
    headerInitSource,
    /animation\.finished\.then\(complete\)\.catch\(\(\) => \{\}\);/,
  );
  assert.match(
    headerInitSource,
    /const complete = \(\) => \{[\s\S]*markHeaderInitCompleted\(\);[\s\S]*markHeaderIntroVisible\(\);[\s\S]*\};/,
  );
  assert.match(
    headerInitSource,
    /if \(hasHeaderInitCompleted\(\)\) \{\s*\n\s*markHeaderIntroVisible\(\);/,
  );
  assert.doesNotMatch(headerInitSource, /--head-intro-y/);
  assert.doesNotMatch(headerInitSource, /\by:\s*'5vh'/);
  assert.doesNotMatch(headerInitSource, /\by:\s*0/);
});

test('page reset temporarily disables smooth scrolling', () => {
  assert.match(pageTransitionSource, /html\.style\.scrollBehavior = 'auto'/);
  assert.match(pageTransitionSource, /html\.getClientRects\(\)/);
  assert.match(pageTransitionSource, /window\.scrollTo\(0, 0\)/);
  assert.match(pageTransitionSource, /html\.style\.scrollBehavior = scrollBehavior/);
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
  assert.match(headStyleSource, /\.blokHeadFrame[\s\S]*height: var\(--blok-height\)/);
  assert.match(headStyleSource, /\.blokHeadFrame[\s\S]*border-color: transparent/);
  assert.match(
    headStyleSource,
    /\.blokHeadFrame[\s\S]*body\[data-fullscreen='true'\][^\n]*&\[data-active='true'\] \.blokHead[\s\S]*transform: translateY\(-100%\)/,
  );
  assert.match(headStyleSource, /\.blokHead[\s\S]*position: absolute[\s\S]*inset: calc\(0px - var\(--border-width\)\)/);
  assert.match(headStyleSource, /\.blokHead[\s\S]*transform: translateY\(0\)/);
  assert.match(headStyleSource, /\.row[\s\S]*height: 100%/);
});

test('perspective origin only animates on the head and first page blok', () => {
  assert.equal(
    (globalStyleSource.match(/perspective-origin var\(--transition-layout\)/g) ?? [])
      .length,
    1,
  );
  assert.match(
    globalStyleSource,
    /\.page[\s\S]*& > \.blok:first-child\n\s+transition: [^\n]*perspective-origin var\(--transition-layout\)/,
  );
  assert.equal(
    (headStyleSource.match(/perspective-origin var\(--transition-layout\)/g) ?? [])
      .length,
    1,
  );
  assert.match(
    headStyleSource,
    /\.blokHead[\s\S]*transition: [^\n]*perspective-origin var\(--transition-layout\)/,
  );
});

test('title overflow measures on discrete layout changes', () => {
  assert.doesNotMatch(routeContentSource, /ResizeObserver/);
  assert.match(
    routeContentSource,
    /event\.target === main && event\.propertyName === 'max-width'/,
  );
  assert.match(
    routeContentSource,
    /main\?\.addEventListener\('transitionend', handleMainTransitionEnd\)/,
  );
  assert.match(
    routeContentSource,
    /window\.addEventListener\('resize', handleResize\)/,
  );
  assert.match(routeContentSource, /document\.fonts\?\.ready\.then\(scheduleMeasure\)/);
});

test('head surface color is token-driven instead of data-surface-driven', () => {
  assert.doesNotMatch(headSource, /data-surface/);
  assert.doesNotMatch(behaviorSource, /HeadSurface|setHeadSurface|dataset\.surface/);
  assert.match(headStyleSource, /background: var\(--theme-blok-head\)/);
});

test('fullscreen quiets selected borders by color without changing border widths', () => {
  assert.match(headSource, /data-scroll-start="true"/);
  assert.match(behaviorSource, /const nextScrollStart = String\(window\.scrollY <= 10\)/);
  assert.match(behaviorSource, /head\.dataset\.scrollStart = nextScrollStart/);
  assert.doesNotMatch(headStyleSource, /:global\(body\[data-fullscreen='true'\]\) \.blokHeadFrame\[data-scroll-start='true'\]/);

  const fullscreenTrueBlock =
    globalStyleSource.match(
      /&\[data-fullscreen="true"\][\s\S]*?&\[data-fullscreen="false"\]/,
    )?.[0] || '';

  assert.match(
    fullscreenTrueBlock,
    /& > \.blok-Head[\s\S]*& > div\n\s+border-top-color: transparent/,
  );
  assert.match(fullscreenTrueBlock, /& > \.blok-Head\[data-scroll-start='true'\]\n\s+& > div\n\s+border-bottom-color: transparent/);
  assert.doesNotMatch(fullscreenTrueBlock, /& > \.blok-Head\[data-scroll-start='true'\]\n\s+& > div\n\s+border-top-color: transparent/);
  assert.match(fullscreenTrueBlock, /border-left-width: 0/);
  assert.match(fullscreenTrueBlock, /border-right-width: 0/);
  assert.match(fullscreenTrueBlock, /&-Footer[\s\S]*border-top-color: transparent/);
  assert.match(fullscreenTrueBlock, /&-Footer[\s\S]*border-bottom-color: transparent/);
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

test('fullscreen-off header uses the shared stack-ready state without its own controller', () => {
  assert.doesNotMatch(behaviorSource, /usePathname|pathname/);
  assert.doesNotMatch(behaviorSource, /isStackGapPage|MOBILE_STACK_ACTIVE_DELAY/);
  assert.doesNotMatch(behaviorSource, /animation-timeline: view\(\)/);
  assert.doesNotMatch(behaviorSource, /matchMedia|hasFineHoverPointer/);
  assert.doesNotMatch(behaviorSource, /mobileActivationTimer|setTimeout|clearTimeout/);
  assert.match(
    headStyleSource,
    /body\[data-fullscreen='true'\][^\n]*&\[data-active='true'\] \.blokHead/,
  );
  assert.match(
    headStyleSource,
    /body\[data-fullscreen='false'\]\[data-header-intro-visible='true'\] main\[data-stack-timeline-ready='true'\][^\n]*& \.blokHead[\s\S]*transform: translateY\(-100%\)/,
  );
  assert.doesNotMatch(headStyleSource, /^\s*&\[data-active='true'\] \.blokHead/m);
});

test('head and panel surface colors use scoped theme tokens', () => {
  assert.match(varsStyleSource, /--theme-blok-head: var\(--theme-blok\)/);
  assert.match(varsStyleSource, /--theme-blok-sidepanel-head: var\(--theme-blok-sidepanel\)/);
  assert.match(varsStyleSource, /--theme-blok-sidepanel-footer: var\(--theme-blok-sidepanel\)/);
  assert.match(varsStyleSource, /body\[data-theme='DARK'\][\s\S]*--theme-blok-head: transparent[\s\S]*--theme-blok-sidepanel-head: transparent/);
  assert.match(varsStyleSource, /body\[data-theme='NIGHT'\][\s\S]*--theme-blok-head: transparent[\s\S]*--theme-blok-sidepanel-head: transparent/);
  assert.match(varsStyleSource, /body\[data-fullscreen='true'\][\s\S]*--theme-blok-head: var\(--theme-blok\)/);
  assert.match(globalStyleSource, /&-Head[\s\S]*\.side[\s\S]*background: var\(--theme-blok-sidepanel-head\)/);
  assert.match(globalStyleSource, /&-Footer[\s\S]*\.side[\s\S]*background: var\(--theme-blok-sidepanel-footer\)/);
  assert.doesNotMatch(sidePanelStyleSource, /data-surface|:global/);
});

test('fullscreen-off ready stack keeps its top panel visible for borders and light surface', () => {
  const fullscreenFalseBlock =
    globalStyleSource.match(
      /&\[data-fullscreen="false"\][\s\S]*?&\[data-theme='NIGHT'\]/,
    )?.[0] || '';

  assert.match(
    fullscreenFalseBlock,
    /main\[data-stack-timeline-ready='true'\][\s\S]*\.side_Top\n\s+opacity: 1/,
  );
});

test('mobile top panel compensates its skewed top border without moving the panel', () => {
  assert.match(
    sidePanelStyleSource,
    /&_Top[\s\S]*@media \(max-width: 770px\)\n\s+border-top-width: calc\(var\(--border-width\) \+ 1px\)/,
  );
  assert.doesNotMatch(sidePanelStyleSource, /@media \(max-width: 770px\)\n\s+top: -1px/);
});

test('layout only exposes top panels outside fullscreen', () => {
  const fullscreenTrueBlock =
    globalStyleSource.match(
      /&\[data-fullscreen="true"\][\s\S]*?&\[data-fullscreen="false"\]/,
    )?.[0] || '';

  assert.doesNotMatch(fullscreenTrueBlock, /\.side_Top[\s\S]*opacity: 1/);
  assert.match(
    globalStyleSource,
    /&\[data-fullscreen="false"\][\s\S]*main\[data-stack-timeline-ready='true'\][\s\S]*\.side_Top\n\s+opacity: 1/,
  );
  assert.doesNotMatch(globalStyleSource, /&:nth-child\(2\)[\s\S]*z-index: -1/);
});

test('header row stays above the visible transparent top panel for clicks', () => {
  assert.match(headStyleSource, /\.row[\s\S]*position: relative/);
  assert.match(headStyleSource, /\.row[\s\S]*z-index: 2/);
});

test('theme foreground transition is body-owned and inherited by chrome', () => {
  assert.match(globalStyleSource, /body[\s\S]*color: var\(--theme-type\)/);
  assert.match(globalStyleSource, /body[\s\S]*transition: [^\n]*color var\(--theme-transition\)/);
  assert.match(headStyleSource, /background: conic-gradient\(from -45deg, currentColor 0deg 180deg, transparent 180deg 360deg\)\n/);
  assert.doesNotMatch(globalStyleSource, /body :where\(\*\)[\s\S]*transition:/);
  assert.doesNotMatch(globalStyleSource, /color-mix\(in srgb, var\(--theme-type\)/);
  assert.doesNotMatch(headStyleSource, /transition: [^\n]*color var\(--theme-transition\)/);
  assert.doesNotMatch(headStyleSource, /transition: [^\n]*border-color var\(--theme-transition\)/);
  assert.match(headStyleSource, /border: var\(--border-width\) solid currentColor/);
  assert.match(headStyleSource, /border: 1\.5px solid currentColor/);
});

test('muted text is computed from the active body theme without parent opacity', () => {
  const darkThemeSource = varsStyleSource.slice(
    varsStyleSource.indexOf("body[data-theme='DARK']"),
    varsStyleSource.indexOf("body[data-theme='NIGHT']"),
  );
  const nightThemeSource = varsStyleSource.slice(
    varsStyleSource.indexOf("body[data-theme='NIGHT']"),
    varsStyleSource.indexOf("body[data-fullscreen='true']"),
  );

  assert.match(
    varsStyleSource,
    /--theme-type-muted: rgba\(5, 2, 0, 0\.35\)/,
  );
  assert.match(darkThemeSource, /--theme-type: white/);
  assert.match(darkThemeSource, /--theme-type-muted: rgba\(255, 255, 255, 0\.5\)/);
  assert.match(darkThemeSource, /--theme-muted-opacity: \.5/);
  assert.match(nightThemeSource, /--theme-type: hsla\(0, 100%, 50%, 1\)/);
  assert.match(nightThemeSource, /--theme-type-muted: rgba\(255, 0, 0, 0\.6\)/);
  assert.match(nightThemeSource, /--theme-muted-opacity: \.6/);
  assert.doesNotMatch(varsStyleSource, /--theme-type-muted: color-mix/);
  assert.match(
    globalStyleSource,
    /\.u-muted\n\s+color: var\(--theme-type-muted\)\n\s+opacity: 1/,
  );
  assert.doesNotMatch(varsStyleSource, /--theme-muted-alpha/);
  assert.doesNotMatch(globalStyleSource, /--theme-muted-alpha/);
});
