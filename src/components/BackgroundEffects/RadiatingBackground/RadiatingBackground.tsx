'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/store';
import IntroEnterButton from '../IntroEnterButton/IntroEnterButton';
import { useIosImmersiveViewport } from '../shared/useIosImmersiveViewport';
import styles from './RadiatingBackground.module.sass';

// Square SVG coordinate system used for all line geometry calculations.
const VIEWBOX_SIZE = 1200;
// Shared origin point for every ray.
const CENTER = VIEWBOX_SIZE / 2;
// Maximum distance from the center to the viewBox edge along a cardinal axis.
const EDGE_DISTANCE = VIEWBOX_SIZE / 2;
// Matches the layout breakpoint where the intro line seed length needs more coverage.
const MOBILE_BREAKPOINT_PX = 770;
// Fallback spin duration if the CSS custom property is missing or invalid.
const DEFAULT_ROTATION_DURATION_MS = 72000;
// Total number of evenly spaced rays in the circle.
const RADIANT_LINE_COUNT = 48;
// Extra rotation applied during the enter intro.
const INTRO_ROTATION_DEGREES = 45;
// Desktop seed length for the intro, expressed relative to the viewport minimum dimension.
const INTRO_START_LINE_LENGTH_VMIN = 25;
// Mobile seed length for the intro to better fill narrow screens.
const INTRO_START_LINE_LENGTH_VMIN_MOBILE = 33;
// Server-safe fallback for intro seed length before viewport measurements are available.
const INTRO_START_LINE_LENGTH_VIEWBOX_FALLBACK = 33;
// Duration of the enter intro line-growth animation.
const INTRO_GROWTH_DURATION_MS = 2000;
// Final multiplier applied to the descriptor-based line length after the intro settles.
const INTRO_TARGET_LINE_SCALE = 1.15;
// Duration used when morphing the dotted-length pattern between offsets.
const DOT_LENGTH_MORPH_DURATION_MS = 420;
// Radius of the dot rendered at the end of each ray.
const LINE_DOT_RADIUS = 1.5;

type RadiatingLineDescriptor = {
  dx: number;
  dy: number;
  fullScale: number;
  index: number;
  opacity: number;
};

const RADIATING_LINE_DESCRIPTORS: RadiatingLineDescriptor[] = Array.from(
  { length: RADIANT_LINE_COUNT },
  (_, index) => {
    const angle = (index / RADIANT_LINE_COUNT) * Math.PI * 2;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const baseToScale =
      EDGE_DISTANCE / Math.max(Math.abs(dx), Math.abs(dy), 0.0001);

    return {
      dx,
      dy,
      fullScale: baseToScale * (1 + 0.025 * Math.sin(index * 0.39)),
      index,
      opacity: 0.82 + 0.18 * (0.5 + 0.5 * Math.sin(index * 0.61)),
    };
  },
);

const parseDurationMs = (
  rawDuration: string,
  fallbackDurationMs = DEFAULT_ROTATION_DURATION_MS,
) => {
  const normalized = rawDuration.trim();
  const parsedDuration = Number.parseFloat(normalized);
  if (!Number.isFinite(parsedDuration)) {
    return fallbackDurationMs;
  }

  return normalized.endsWith('ms') ? parsedDuration : parsedDuration * 1000;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const easeOutCubic = (progress: number) => 1 - (1 - progress) ** 3;

const getIntroStartLineLength = () => {
  if (typeof window === 'undefined') {
    return INTRO_START_LINE_LENGTH_VIEWBOX_FALLBACK;
  }

  const viewportMin = Math.min(window.innerWidth, window.innerHeight);
  const viewportMax = Math.max(window.innerWidth, window.innerHeight);
  const introStartLengthVmin =
    window.innerWidth < MOBILE_BREAKPOINT_PX
      ? INTRO_START_LINE_LENGTH_VMIN_MOBILE
      : INTRO_START_LINE_LENGTH_VMIN;
  const spinLayerSizePx = viewportMax * 2;

  if (!Number.isFinite(spinLayerSizePx) || spinLayerSizePx <= 0) {
    return INTRO_START_LINE_LENGTH_VIEWBOX_FALLBACK;
  }

  const introStartLengthPx = viewportMin * (introStartLengthVmin / 100);

  return (introStartLengthPx / spinLayerSizePx) * VIEWBOX_SIZE;
};

const useStableEvent = <Args extends unknown[], Return>(
  handler: (...args: Args) => Return,
) => {
  const handlerRef = useRef(handler);

  useLayoutEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  return useCallback((...args: Args) => handlerRef.current(...args), []);
};

const getDotLengthFactor = (index: number, offset: number) =>
  0.18 +
  0.72 *
    (0.5 +
      0.5 *
        Math.sin(
          index * 0.47 + offset * 1.31 + 0.9 * Math.cos(index * 0.13 + offset),
        ));

type InitRadiatingOptions = {
  lineDurationMs?: number;
  lineStaggerMs?: number;
};

const DEFAULT_INIT_RADIATING_OPTIONS: Required<InitRadiatingOptions> = {
  // initRadiating option: `lineDurationMs` controls how long each individual ray takes to grow from `0` to the init target length.
  lineDurationMs: 1000,
  // initRadiating option: `lineStaggerMs` delays each subsequent ray so the init reveal cascades around the circle instead of expanding all at once.
  lineStaggerMs: 12,
};

const resolveInitRadiatingOptions = (
  options?: InitRadiatingOptions,
): Required<InitRadiatingOptions> => ({
  ...DEFAULT_INIT_RADIATING_OPTIONS,
  ...options,
});

const getInitRadiatingLineScale = (
  descriptor: RadiatingLineDescriptor,
  elapsedMs: number,
  introStartLineLength: number,
  options: Required<InitRadiatingOptions>,
) => {
  const lineDelayMs = descriptor.index * options.lineStaggerMs;
  const lineProgress = clamp01(
    (elapsedMs - lineDelayMs) / Math.max(1, options.lineDurationMs),
  );

  return introStartLineLength * easeOutCubic(lineProgress);
};

type IntroAnimationControllers = {
  applyLineGeometry: () => void;
  introActiveRef: { current: boolean };
  introFrameRef: { current: number | null };
  introProgressRef: { current: number };
  rotationOffsetRef: { current: number };
  lineGrowthMultiplierRef: { current: number };
  onComplete?: () => void;
};

type InitRadiatingControllers = {
  applyLineGeometry: () => void;
  initActiveRef: { current: boolean };
  initElapsedMsRef: { current: number };
  initFrameRef: { current: number | null };
  initOptionsRef: { current: Required<InitRadiatingOptions> };
  introActiveRef: { current: boolean };
  introProgressRef: { current: number };
  rotationOffsetRef: { current: number };
  lineGrowthMultiplierRef: { current: number };
  options?: InitRadiatingOptions;
};

const initRadiating = ({
  applyLineGeometry,
  initActiveRef,
  initElapsedMsRef,
  initFrameRef,
  initOptionsRef,
  introActiveRef,
  introProgressRef,
  rotationOffsetRef,
  lineGrowthMultiplierRef,
  options,
}: InitRadiatingControllers) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (initFrameRef.current !== null) {
    window.cancelAnimationFrame(initFrameRef.current);
  }

  const resolvedOptions = resolveInitRadiatingOptions(options);
  const totalLineDurationMs =
    resolvedOptions.lineDurationMs +
    resolvedOptions.lineStaggerMs * Math.max(0, RADIANT_LINE_COUNT - 1);

  initOptionsRef.current = resolvedOptions;
  lineGrowthMultiplierRef.current = INTRO_TARGET_LINE_SCALE;
  introActiveRef.current = true;
  introProgressRef.current = 0;
  initActiveRef.current = true;
  initElapsedMsRef.current = 0;
  applyLineGeometry();

  const startTime = performance.now();
  const startRotationOffset = rotationOffsetRef.current;
  const targetRotationOffset = startRotationOffset + INTRO_ROTATION_DEGREES;

  const animate = (now: number) => {
    const elapsedMs = now - startTime;
    const clampedElapsedMs = Math.min(totalLineDurationMs, elapsedMs);
    const progress = clamp01(elapsedMs / Math.max(1, totalLineDurationMs));
    const easedProgress = easeOutCubic(progress);

    initElapsedMsRef.current = clampedElapsedMs;
    rotationOffsetRef.current =
      startRotationOffset +
      (targetRotationOffset - startRotationOffset) * easedProgress;
    applyLineGeometry();

    if (elapsedMs < totalLineDurationMs) {
      initFrameRef.current = window.requestAnimationFrame(animate);
      return;
    }

    initActiveRef.current = false;
    initElapsedMsRef.current = totalLineDurationMs;
    initFrameRef.current = null;
    applyLineGeometry();
  };

  initFrameRef.current = window.requestAnimationFrame(animate);
};

const startRadiatingIntro = ({
  applyLineGeometry,
  introActiveRef,
  introFrameRef,
  introProgressRef,
  rotationOffsetRef,
  onComplete,
}: IntroAnimationControllers) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (introFrameRef.current !== null) {
    window.cancelAnimationFrame(introFrameRef.current);
  }

  const startTime = performance.now();
  const startRotationOffset = rotationOffsetRef.current;
  const targetRotationOffset = startRotationOffset + INTRO_ROTATION_DEGREES;

  const animate = (now: number) => {
    const progress = Math.min(1, (now - startTime) / INTRO_GROWTH_DURATION_MS);
    const easedProgress = easeOutCubic(progress);
    introProgressRef.current = easedProgress;
    rotationOffsetRef.current =
      startRotationOffset +
      (targetRotationOffset - startRotationOffset) * easedProgress;
    applyLineGeometry();

    if (progress < 1) {
      introFrameRef.current = window.requestAnimationFrame(animate);
      return;
    }

    introActiveRef.current = false;
    introProgressRef.current = 1;
    applyLineGeometry();
    introFrameRef.current = null;
    onComplete?.();
  };

  introFrameRef.current = window.requestAnimationFrame(animate);
};

const getRadiatingLineScale = (
  descriptor: RadiatingLineDescriptor,
  dotLengthVariationMix: number,
  dotLengthPatternOffset: number,
  lineGrowthMultiplier: number,
  introStartLineLength: number,
  initActive: boolean,
  initElapsedMs: number,
  initOptions: Required<InitRadiatingOptions>,
  introActive: boolean,
  introProgress: number,
) => {
  if (initActive) {
    return getInitRadiatingLineScale(
      descriptor,
      initElapsedMs,
      introStartLineLength,
      initOptions,
    );
  }

  const dottedLengthFactor = getDotLengthFactor(
    descriptor.index,
    dotLengthPatternOffset,
  );
  const lengthFactor =
    1 - dotLengthVariationMix + dotLengthVariationMix * dottedLengthFactor;
  const targetScale = descriptor.fullScale * lengthFactor * lineGrowthMultiplier;

  if (introActive) {
    return (
      introStartLineLength +
      (targetScale - introStartLineLength) * introProgress
    );
  }

  return targetScale;
};

export default function RadiatingBackground() {
  const pathname = usePathname();
  const initialThemeIntroPending = useStore(
    (state) => state.initialThemeIntroPending,
  );
  const hidePageContent = useStore((state) => state.hidePageContent);
  const showPageContent = useStore((state) => state.showPageContent);
  const revealPageContent = useStore((state) => state.revealPageContent);
  const rootRef = useRef<HTMLDivElement>(null);
  const spinLayerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const lineGrowthMultiplierRef = useRef(INTRO_TARGET_LINE_SCALE);
  const initActiveRef = useRef(initialThemeIntroPending);
  const initElapsedMsRef = useRef(0);
  const initFrameRef = useRef<number | null>(null);
  const initOptionsRef = useRef(resolveInitRadiatingOptions());
  const introActiveRef = useRef(initialThemeIntroPending);
  const introFrameRef = useRef<number | null>(null);
  const introProgressRef = useRef(initialThemeIntroPending ? 0 : 1);
  const rotationOffsetRef = useRef(0);
  const hasCompletedIntroRef = useRef(!initialThemeIntroPending);
  const dotLengthMorphFrameRef = useRef<number | null>(null);
  // `0` keeps full-length lines, `1` fully applies the patterned dotted lengths.
  const dotLengthVariationMixRef = useRef(1);
  // Offsets the sine-based dot pattern so route changes subtly reshuffle the composition.
  const dotLengthPatternOffsetRef = useRef(0);
  const hasSeenPathnameRef = useRef(false);
  const [showEnterButton, setShowEnterButton] = useState(
    initialThemeIntroPending,
  );
  const lineDescriptors = RADIATING_LINE_DESCRIPTORS;

  useIosImmersiveViewport();

  const applyLineGeometry = useStableEvent(() => {
    const introStartLineLength = getIntroStartLineLength();

    for (let index = 0; index < lineDescriptors.length; index += 1) {
      const descriptor = lineDescriptors[index];
      if (!descriptor) continue;

      const scale = getRadiatingLineScale(
        descriptor,
        dotLengthVariationMixRef.current,
        dotLengthPatternOffsetRef.current,
        lineGrowthMultiplierRef.current,
        introStartLineLength,
        initActiveRef.current,
        initElapsedMsRef.current,
        initOptionsRef.current,
        introActiveRef.current,
        introProgressRef.current,
      );
      const x2 = CENTER + descriptor.dx * scale;
      const y2 = CENTER + descriptor.dy * scale;
      const line = lineRefs.current[index];
      const dot = dotRefs.current[index];

      if (line) {
        line.x2.baseVal.value = x2;
        line.y2.baseVal.value = y2;
      }

      if (dot) {
        dot.cx.baseVal.value = x2;
        dot.cy.baseVal.value = y2;
      }
    }
  });

  useLayoutEffect(() => {
    lineRefs.current.length = RADIANT_LINE_COUNT;
    dotRefs.current.length = RADIANT_LINE_COUNT;
    applyLineGeometry();
  }, [applyLineGeometry]);

  useEffect(() => {
    const root = rootRef.current;
    const spinLayer = spinLayerRef.current;
    if (!root || !spinLayer) return;

    const durationMs = parseDurationMs(
      getComputedStyle(root).getPropertyValue('--rb-rotation-duration'),
    );
    const safeDurationMs = Math.max(1, durationMs);
    const baseDegreesPerMs = 360 / safeDurationMs;

    let frameId = 0;
    let lastTimestamp = 0;
    let rotation = 0;
    let isRunning = false;

    const animate = (now: number) => {
      if (!lastTimestamp) {
        lastTimestamp = now;
      }

      const deltaMs = now - lastTimestamp;
      lastTimestamp = now;
      rotation = (rotation + deltaMs * baseDegreesPerMs) % 360;
      const degrees = rotation + rotationOffsetRef.current;

      spinLayer.style.transform = `translate3d(-50%, -50%, 0) rotate(${degrees}deg)`;
      frameId = window.requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (isRunning) return;

      isRunning = true;
      lastTimestamp = 0;
      frameId = window.requestAnimationFrame(animate);
    };

    const stopAnimation = () => {
      if (!isRunning) return;

      isRunning = false;
      window.cancelAnimationFrame(frameId);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAnimation();
        return;
      }

      startAnimation();
    };

    if (!document.hidden) {
      startAnimation();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopAnimation();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      spinLayer.style.transform = 'translate3d(-50%, -50%, 0) rotate(0deg)';
    };
  }, []);

  useEffect(() => {
    const initAnimationFrameRef = initFrameRef;
    const introAnimationFrameRef = introFrameRef;
    const dotLengthAnimationFrameRef = dotLengthMorphFrameRef;

    return () => {
      if (initAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(initAnimationFrameRef.current);
      }
      if (introAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(introAnimationFrameRef.current);
      }
      if (dotLengthAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(dotLengthAnimationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (initialThemeIntroPending) {
      hasCompletedIntroRef.current = false;
      hidePageContent();
      setShowEnterButton(true);
      initRadiating({
        applyLineGeometry,
        initActiveRef,
        initElapsedMsRef,
        initFrameRef,
        initOptionsRef,
        introActiveRef,
        introProgressRef,
        rotationOffsetRef,
        lineGrowthMultiplierRef,
        options: DEFAULT_INIT_RADIATING_OPTIONS,
      });
    } else {
      if (initFrameRef.current !== null) {
        window.cancelAnimationFrame(initFrameRef.current);
        initFrameRef.current = null;
      }
      initActiveRef.current = false;
      setShowEnterButton(false);
      showPageContent();
      introActiveRef.current = false;
      introProgressRef.current = 1;
      if (!hasCompletedIntroRef.current) {
        rotationOffsetRef.current = 0;
      }
      lineGrowthMultiplierRef.current = INTRO_TARGET_LINE_SCALE;
      applyLineGeometry();
    }

    return () => {
      if (initFrameRef.current !== null) {
        window.cancelAnimationFrame(initFrameRef.current);
        initFrameRef.current = null;
      }
      if (introFrameRef.current !== null) {
        window.cancelAnimationFrame(introFrameRef.current);
        introFrameRef.current = null;
      }
    };
  }, [
    applyLineGeometry,
    hidePageContent,
    initialThemeIntroPending,
    showPageContent,
  ]);

  const handleEnter = useCallback(() => {
    setShowEnterButton(false);

    if (initFrameRef.current !== null) {
      window.cancelAnimationFrame(initFrameRef.current);
      initFrameRef.current = null;
    }

    initActiveRef.current = false;
    rotationOffsetRef.current = 0;
    applyLineGeometry();

    startRadiatingIntro({
      applyLineGeometry,
      introActiveRef,
      introFrameRef,
      introProgressRef,
      rotationOffsetRef,
      lineGrowthMultiplierRef,
      onComplete: () => {
        hasCompletedIntroRef.current = true;
        revealPageContent();
      },
    });
  }, [applyLineGeometry, revealPageContent]);

  const animateDotLengthsTo = (targetMix: number, targetOffset: number) => {
    if (dotLengthMorphFrameRef.current !== null) {
      window.cancelAnimationFrame(dotLengthMorphFrameRef.current);
    }

    const startMix = dotLengthVariationMixRef.current;
    const startOffset = dotLengthPatternOffsetRef.current;
    const startTime = performance.now();

    const animate = (now: number) => {
      const progress = Math.min(
        1,
        (now - startTime) / DOT_LENGTH_MORPH_DURATION_MS,
      );
      const easedProgress = easeOutCubic(progress);
      const nextMix = startMix + (targetMix - startMix) * easedProgress;
      const nextOffset =
        startOffset + (targetOffset - startOffset) * easedProgress;

      dotLengthVariationMixRef.current = nextMix;
      dotLengthPatternOffsetRef.current = nextOffset;
      applyLineGeometry();

      if (progress < 1) {
        dotLengthMorphFrameRef.current = window.requestAnimationFrame(animate);
        return;
      }

      dotLengthMorphFrameRef.current = null;
    };

    dotLengthMorphFrameRef.current = window.requestAnimationFrame(animate);
  };

  const shiftDotLengths = useStableEvent(() => {
    const nextOffset = dotLengthPatternOffsetRef.current + 1.35;

    animateDotLengthsTo(1, nextOffset);
  });

  useEffect(() => {
    if (!hasSeenPathnameRef.current) {
      hasSeenPathnameRef.current = true;
      return;
    }

    shiftDotLengths();
  }, [pathname, shiftDotLengths]);

  const renderIntroStartLineLength = getIntroStartLineLength();

  return (
    <>
      <div
        ref={rootRef}
        className={styles.root}
        data-version="radiating"
        aria-hidden="true"
      >
        <div ref={spinLayerRef} className={styles.radiatingSpinLayer}>
          <svg
            className={styles.svg}
            viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
            preserveAspectRatio="xMidYMid slice"
            role="presentation"
          >
            <rect
              className={styles.background}
              width={VIEWBOX_SIZE}
              height={VIEWBOX_SIZE}
            />
            <g className={styles.lines}>
              {lineDescriptors.map((descriptor, index) => {
                const scale = getRadiatingLineScale(
                  descriptor,
                  dotLengthVariationMixRef.current,
                  dotLengthPatternOffsetRef.current,
                  lineGrowthMultiplierRef.current,
                  renderIntroStartLineLength,
                  initActiveRef.current,
                  initElapsedMsRef.current,
                  initOptionsRef.current,
                  introActiveRef.current,
                  introProgressRef.current,
                );
                const x2 = CENTER + descriptor.dx * scale;
                const y2 = CENTER + descriptor.dy * scale;

                return (
                  <g key={index}>
                    <line
                      ref={(node) => {
                        lineRefs.current[index] = node;
                      }}
                      className={styles.line}
                      x1={CENTER}
                      y1={CENTER}
                      x2={x2}
                      y2={y2}
                      opacity={descriptor.opacity}
                    />
                    <circle
                      ref={(node) => {
                        dotRefs.current[index] = node;
                      }}
                      className={styles.lineDot}
                      cx={x2}
                      cy={y2}
                      opacity={descriptor.opacity}
                      r={LINE_DOT_RADIUS}
                    />
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>
      {showEnterButton && <IntroEnterButton onClick={handleEnter} />}
    </>
  );
}
