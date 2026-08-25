import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const componentSource = readFileSync(
  new URL('./ColorBurstTypography.tsx', import.meta.url),
  'utf8',
);
const themeSource = readFileSync(new URL('../../lib/theme.ts', import.meta.url), 'utf8');
const textSource = readFileSync(new URL('./ColorBurstText.tsx', import.meta.url), 'utf8');
const styleSource = readFileSync(
  new URL('./ColorBurstTypography.module.sass', import.meta.url),
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
const experienceStyleSource = readFileSync(
  new URL('../storyblok/BlokExperience/BlokExperience.module.sass', import.meta.url),
  'utf8',
);
const filterStyleSource = readFileSync(
  new URL('../BlokFilter/BlokFilter.module.sass', import.meta.url),
  'utf8',
);
const activationSource = componentSource.slice(
  componentSource.indexOf('const activateCharacter'),
  componentSource.indexOf('const restoreAll'),
);
const timedBurstSource = componentSource.slice(
  componentSource.indexOf('const burstTimedCharacters'),
  componentSource.indexOf('const scheduleTimedBurst'),
);
const headerSource = readFileSync(
  new URL('../BlokHead/BlokHeadRouteContent.tsx', import.meta.url),
  'utf8',
);
const headerStyleSource = readFileSync(
  new URL('../BlokHead/BlokHead.module.sass', import.meta.url),
  'utf8',
);
const layoutSource = readFileSync(new URL('../../app/layout.tsx', import.meta.url), 'utf8');
const columnTextSource = readFileSync(
  new URL('../storyblok/ColumnTextClient.tsx', import.meta.url),
  'utf8',
);
const expandableTextSource = readFileSync(
  new URL('../storyblok/ColumnTextExpandableClient.tsx', import.meta.url),
  'utf8',
);
const projectSource = readFileSync(new URL('../BlokProject.tsx', import.meta.url), 'utf8');
const sliderIndicatorSource = readFileSync(
  new URL('../SliderIndicators/SliderIndicators.tsx', import.meta.url),
  'utf8',
);
const surfaceSources = [
  '../BlokHead/BlokHeadRouteContent.tsx',
  '../BlokFooter/BlokFooter.tsx',
  '../BlokFooter/FooterNav.tsx',
  '../storyblok/BlokExperience/BlokExperience.tsx',
  '../BlokFilter/BlokFilter.tsx',
  '../BlokProject.tsx',
  '../storyblok/ColumnImage.tsx',
  '../storyblok/ColumnVideo.tsx',
  '../storyblok/ColumnSlider.tsx',
  '../InlineWordSwapText/renderWordSwap.tsx',
  '../InlineWordSwapText/WordSwapRotatorClient.tsx',
].map((path) => readFileSync(new URL(path, import.meta.url), 'utf8'));

test('color burst uses a one-shot 75px core, dispersed satellites, and lingering real glyphs', () => {
  assert.doesNotMatch(componentSource, /SplitText/);
  assert.match(textSource, /styles\.character/);
  assert.match(textSource, /Array\.from\(children\)/);
  assert.match(textSource, /aria-hidden="true"/);
  assert.match(componentSource, /addEventListener\(['"]pointermove['"]/);
  assert.match(componentSource, /addEventListener\(['"]pointerleave['"]/);
  assert.match(componentSource, /removeEventListener\(['"]pointermove['"]/);
  assert.match(componentSource, /removeEventListener\(['"]pointerleave['"]/);
  assert.match(componentSource, /getBoundingClientRect\(\)/);
  assert.match(componentSource, /CORE_RADIUS\s*=\s*75/);
  assert.match(componentSource, /SATELLITE_DISTANCE\s*=\s*150/);
  assert.match(componentSource, /CORE_ACTIVATION_CHANCE\s*=\s*0\.9/);
  assert.match(componentSource, /TEXT_HOLD_MAX_SECONDS\s*=\s*0\.45/);
  assert.doesNotMatch(componentSource, /OUTER_RADIUS|OUTER_NEAR_CHANCE|OUTER_FAR_CHANCE|getActivationChance/);
  assert.match(componentSource, /new WeakMap<HTMLElement, number>\(\)/);
  assert.match(componentSource, /getStableWeight\(character\) > activationChance/);
  assert.match(componentSource, /const getSatelliteCharacters/);
  assert.match(componentSource, /anchor\.closest<HTMLElement>\(['"]p['"]\) \?\? activeSurface/);
  assert.match(componentSource, /offset >= 8 && distance >= SATELLITE_DISTANCE/);
  assert.match(componentSource, /getComputedStyle\(character\)\.visibility === ['"]hidden['"]/);
  assert.match(componentSource, /getStableWeight\(anchor\) < 0\.5 \? 2 : 3/);
  assert.match(componentSource, /const lingerTimeouts = new Map<HTMLElement, number>\(\)/);
  assert.match(componentSource, /MAX_LINGERING_CHARACTERS\s*=\s*4/);
  assert.match(componentSource, /LINGER_MIN_MS\s*=\s*250/);
  assert.match(componentSource, /LINGER_MAX_MS\s*=\s*700/);
  assert.match(componentSource, /clearLinger\(character\)/);
  assert.match(componentSource, /Math\.hypot\(/);
  assert.match(componentSource, /activeCharacters/);
  assert.match(componentSource, /nearbyCharacters/);
  assert.match(componentSource, /requestAnimationFrame/);
  assert.match(componentSource, /0\.03/);
  assert.match(componentSource, /duration:\s*0\.3/);
  assert.match(activationSource, /repeat:\s*1/);
  assert.match(
    activationSource,
    /const holdDuration = isColorOnly[\s\S]*\? 0[\s\S]*Math\.random\(\) \* TEXT_HOLD_MAX_SECONDS/,
  );
  assert.match(activationSource, /repeatDelay:\s*holdDuration/);
  assert.match(activationSource, /yoyo:\s*true/);
  assert.match(
    activationSource,
    /onComplete:\s*\(\) => \{[\s\S]*activeCharacters\.delete\(character\)[\s\S]*restoreCharacter\(character\)/,
  );
  assert.match(componentSource, /power3\.out/);
  assert.match(componentSource, /#85AF00/);
  assert.match(componentSource, /#FFCC00/);
  assert.match(componentSource, /#FB9CFD/);
  assert.match(componentSource, /#A19BFF/);
  assert.match(componentSource, /#FF4C00/);
  assert.match(componentSource, /Math\.random\(\) < 0\.5/);
  assert.match(componentSource, /A:\s*['"]4['"]/);
  assert.match(componentSource, /B:\s*['"]8['"]/);
  assert.match(componentSource, /E:\s*['"]3['"]/);
  assert.match(componentSource, /L:\s*['"]1['"]/);
  assert.match(componentSource, /O:\s*['"]0['"]/);
  assert.match(componentSource, /S:\s*['"]5['"]/);
  assert.match(componentSource, /T:\s*['"]7['"]/);
  assert.match(componentSource, /REPLACEMENTS\[original\.toUpperCase\(\)\]/);
  assert.doesNotMatch(componentSource, /SYMBOLS/);
  assert.match(componentSource, /textContent\s*=\s*original/);
  assert.match(componentSource, /restoreCharacter/);
  assert.doesNotMatch(componentSource, /cloneNode\(/);
  assert.doesNotMatch(componentSource, /createElement\(/);
  assert.doesNotMatch(componentSource, /dataset\.colorBurstAccent/);
  assert.doesNotMatch(componentSource, /△x/);
  assert.doesNotMatch(componentSource, /radial-gradient/);
  assert.doesNotMatch(componentSource, /data-color-burst-layer/);
  assert.match(styleSource, /\.character/);
  assert.doesNotMatch(styleSource, /radial-gradient/);
  assert.doesNotMatch(styleSource, /mask-image/);
});

test('some active text glyphs get a small border without shifting layout or affecting icons', () => {
  assert.match(
    componentSource,
    /if \(!isColorOnly && Math\.random\(\) < 0\.1\)/,
  );
  assert.match(componentSource, /delete character\.dataset\.colorBurstBorder/);
  assert.match(styleSource, /\[data-color-burst-border='true'\]/);
  assert.match(styleSource, /outline: 1px solid currentColor/);
  assert.doesNotMatch(styleSource, /\bborder:/);
});

test('muted blok copy keeps burst glyphs at full brightness', () => {
  assert.match(
    varsStyleSource,
    /--theme-type-muted: rgba\(5, 2, 0, 0\.35\)/,
  );
  assert.match(varsStyleSource, /--theme-type-muted: rgba\(255, 255, 255, 0\.5\)/);
  assert.match(varsStyleSource, /--theme-type-muted: rgba\(255, 0, 0, 0\.6\)/);
  assert.doesNotMatch(varsStyleSource, /--theme-type-muted: color-mix/);
  assert.match(
    globalStyleSource,
    /&\[data-color='secondary'\][\s\S]*color: var\(--theme-type-muted\)[\s\S]*opacity: 1/,
  );
  assert.match(
    globalStyleSource,
    /&-Caption\n\s+color: var\(--theme-type-muted\)\n\s+opacity: 1/,
  );
  assert.match(
    experienceStyleSource,
    /&:first-child[\s\S]*color: var\(--theme-type-muted\)\n\s+opacity: 1/,
  );
  assert.match(
    experienceStyleSource,
    /\.rowRole\n\s+color: var\(--theme-type-muted\)\n\s+opacity: 1/,
  );
  assert.match(
    filterStyleSource,
    /\[data-active="true"\]\n\s+color: var\(--theme-type-muted\)\n\s+opacity: 1/,
  );
});

test('icon bursts exclude red and also exclude yellow in the light theme', () => {
  assert.match(
    componentSource,
    /const ICON_COLORS = \['#85AF00', '#FFCC00', '#FB9CFD', '#A19BFF'\]/,
  );
  assert.match(
    componentSource,
    /const LIGHT_ICON_COLORS = \['#85AF00', '#FB9CFD', '#A19BFF'\]/,
  );
  assert.match(componentSource, /target\.matches\(COLOR_ONLY_TARGETS\)/);
  assert.match(componentSource, /document\.body\.dataset\.theme === LIGHT_THEME/);
  assert.match(activationSource, /getBurstColor\(character\)/);
  assert.match(
    activationSource,
    /const isColorOnly = character\.matches\(COLOR_ONLY_TARGETS\)/,
  );
  assert.match(
    activationSource,
    /if \(!isColorOnly\) character\.dataset\.colorBurstOriginal = original/,
  );
});

test('color bursts only run in light and dark themes', () => {
  assert.match(
    themeSource,
    /isColorBurstTheme = \(theme: Theme\) => theme !== NIGHT_THEME/,
  );
  assert.match(componentSource, /useStore\(\(state\) => state\.theme\)/);
  assert.match(componentSource, /!isColorBurstTheme\(theme\)/);
  assert.match(componentSource, /\}, \[theme\]\)/);
});

test('slider indicators use the contrast-safe color-only burst path', () => {
  assert.match(componentSource, /\[data-color-burst-shape\]/);
  assert.match(componentSource, /\[data-color-burst-indicators\]/);
  assert.match(sliderIndicatorSource, /data-color-burst-indicators/);
  assert.match(sliderIndicatorSource, /data-color-burst-shape/);
});

test('Creative Developer bursts left to right at a random 30 to 60 second cadence', () => {
  assert.match(componentSource, /const burstTimedCharacters/);
  assert.match(componentSource, /TIMED_BURST_MIN_MS\s*=\s*30_000/);
  assert.match(componentSource, /TIMED_BURST_MAX_MS\s*=\s*60_000/);
  assert.match(componentSource, /const scheduleTimedBurst/);
  assert.match(componentSource, /setTimeout\([\s\S]*burstTimedCharacters/);
  assert.match(
    componentSource,
    /Math\.random\(\) \* \(TIMED_BURST_MAX_MS - TIMED_BURST_MIN_MS\)/,
  );
  assert.match(componentSource, /clearTimeout\(timedBurstTimeout\)/);
  assert.doesNotMatch(componentSource, /setInterval|clearInterval/);
  assert.match(componentSource, /\[data-color-burst-timed\] \.\$\{styles\.character\}/);
  assert.match(componentSource, /delay:\s*index \* 0\.03/);
  assert.match(timedBurstSource, /duration:\s*0\.6/);
  assert.match(componentSource, /repeat:\s*1/);
  assert.match(componentSource, /yoyo:\s*true/);
  assert.match(
    headerSource,
    /<ColorBurstText>Dries Bos —<\/ColorBurstText>[\s\S]*<span className=\{styles\.timedTitle\} data-color-burst-timed>[\s\S]*<ColorBurstText> Creative Developer<\/ColorBurstText>/,
  );
  assert.match(headerStyleSource, /\.timedTitle\n\s+margin-left: \.25em/);
});

test('one page runtime covers the requested bloks, captions, and icons', () => {
  assert.match(layoutSource, /<ColorBurstTypography\s*\/>/);
  assert.doesNotMatch(columnTextSource, /<ColorBurstTypography/);
  assert.doesNotMatch(expandableTextSource, /<ColorBurstTypography/);
  assert.match(componentSource, /document\.querySelector<HTMLElement>\(['"]main['"]\)/);
  assert.doesNotMatch(componentSource, /usePathname\(\)/);
  assert.match(componentSource, /\.blok-Head/);
  assert.match(componentSource, /\.blok-Footer/);
  assert.match(componentSource, /\.blok-Exp/);
  assert.match(componentSource, /\.blok-Intro/);
  assert.match(componentSource, /\.blok-Filter/);
  assert.match(componentSource, /\.blok-ProjectList \.blok-Project/);
  assert.match(componentSource, /\.column-Caption/);
  assert.match(componentSource, /ICON_TARGETS/);
  assert.match(componentSource, /PROJECT_NAV_TARGET = '\.column-Icons_NextPrev'/);
  assert.match(
    componentSource,
    /closest<HTMLElement>\(PROJECT_NAV_TARGET\) \?\?/,
  );
  assert.match(componentSource, /closest<HTMLElement>\(SURFACE_TARGETS\)/);
  assert.match(projectSource, /<ColorBurstText>/);
  assert.match(
    headerSource,
    /className="projectNumber headerDesktop"[\s\S]*<ColorBurstText>/,
  );
  assert.match(
    globalStyleSource,
    /\.projectNumber\n\s+font-size: 0\.66rem\n\s+color: var\(--theme-type-muted\)\n\s+opacity: 1/,
  );
  assert.doesNotMatch(componentSource, /new MutationObserver/);
  surfaceSources.forEach((source) => assert.match(source, /ColorBurstText/));
});
