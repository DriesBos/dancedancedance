'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type p5 from 'p5';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/store';
import IntroEnterButton from './IntroEnterButton';
import styles from './BackgroundEffects.module.sass';

const BirdsScene = dynamic(() => import('./birdsScene'), { ssr: false });

const VIEWBOX_SIZE = 1200;
const CENTER = VIEWBOX_SIZE / 2;
const EDGE_DISTANCE = VIEWBOX_SIZE / 2;
const MOBILE_BREAKPOINT_PX = 770;
const DEFAULT_LINE_GAP = 18;
const DEFAULT_ROTATION_DURATION_MS = 72000;
const MAX_LINE_COUNT = 1440;
// Intro: start at a viewport-relative spoke length, then grow beyond the
// viewport while rotating once the explicit enter control is pressed.
const INTRO_ROTATION_DEGREES = 45;
const INTRO_START_LINE_LENGTH_VMIN = 25;
const INTRO_START_LINE_LENGTH_VMIN_MOBILE = 33;
const INTRO_START_LINE_LENGTH_VIEWBOX_FALLBACK = 33;
const INTRO_GROWTH_DURATION_MS = 2000;
const INTRO_TARGET_LINE_SCALE = 1.15;
const DOT_LENGTH_MORPH_DURATION_MS = 420;
const LINE_DOT_RADIUS = 1.5;
const SEGMENTS_SCALE_DURATION_MS = 60000;
const SEGMENTS_SCALE_DURATION_PORTRAIT_MS = 30000;
const IOS_IMMERSIVE_HEIGHT_VAR = '--be-ios-immersive-height';
const IOS_IMMERSIVE_WIDTH_VAR = '--be-ios-immersive-width';

const isIosSafari = () => {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent;
  const isIosDevice =
    /iP(hone|ad|od)/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isWebKit = /WebKit/i.test(ua);
  const isNonSafariBrowser =
    /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|YaBrowser/i.test(ua);

  return isIosDevice && isWebKit && !isNonSafariBrowser;
};

type BackgroundEffectsProps = {
  version: 'radiating' | 'segments' | 'kusama' | 'birds';
  densityScale?: number;
};

type RadiatingVariant = 'standard' | 'variable-dots' | 'all-dots';
type RadiatingLineDescriptor = {
  dx: number;
  dy: number;
  fullScale: number;
  index: number;
  opacity: number;
};

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

// Returns the variable-length profile used by dotted variants. The offset lets
// CHANGE LENGTHS re-roll the composition without changing the overall pattern range.
const getDotLengthFactor = (index: number, offset: number) =>
  0.18 +
  0.72 *
    (0.5 +
      0.5 *
        Math.sin(
          index * 0.47 + offset * 1.31 + 0.9 * Math.cos(index * 0.13 + offset),
        ));

type IntroAnimationControllers = {
  applyLineGeometry: () => void;
  introActiveRef: { current: boolean };
  introFrameRef: { current: number | null };
  introProgressRef: { current: number };
  introRotationOffsetRef: { current: number };
  lineGrowthMultiplierRef: { current: number };
  onComplete?: () => void;
};

const prepareRadiatingIntro = ({
  applyLineGeometry,
  introActiveRef,
  introFrameRef,
  introProgressRef,
  introRotationOffsetRef,
  lineGrowthMultiplierRef,
}: IntroAnimationControllers) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (introFrameRef.current !== null) {
    window.cancelAnimationFrame(introFrameRef.current);
  }

  lineGrowthMultiplierRef.current = INTRO_TARGET_LINE_SCALE;
  introActiveRef.current = true;
  introProgressRef.current = 0;
  introRotationOffsetRef.current = 0;
  applyLineGeometry();
};

const startRadiatingIntro = ({
  applyLineGeometry,
  introActiveRef,
  introFrameRef,
  introProgressRef,
  introRotationOffsetRef,
  onComplete,
}: IntroAnimationControllers) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (introFrameRef.current !== null) {
    window.cancelAnimationFrame(introFrameRef.current);
  }

  const startTime = performance.now();
  const startRotationOffset = introRotationOffsetRef.current;
  const targetRotationOffset = startRotationOffset + INTRO_ROTATION_DEGREES;

  const animate = (now: number) => {
    const progress = Math.min(1, (now - startTime) / INTRO_GROWTH_DURATION_MS);
    const easedProgress = easeOutCubic(progress);
    introProgressRef.current = easedProgress;
    introRotationOffsetRef.current =
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
  variant: RadiatingVariant,
  dotLengthVariationMix: number,
  dotLengthPatternOffset: number,
  lineGrowthMultiplier: number,
  introStartLineLength: number,
  introActive: boolean,
  introProgress: number,
) => {
  const dottedLengthFactor = getDotLengthFactor(
    descriptor.index,
    dotLengthPatternOffset,
  );
  const lengthFactor =
    variant !== 'standard'
      ? 1 - dotLengthVariationMix + dotLengthVariationMix * dottedLengthFactor
      : 1;
  const targetScale = descriptor.fullScale * lengthFactor * lineGrowthMultiplier;

  // During the intro test, lines start at a fixed viewport-relative length
  // before growing toward their normal target scale.
  if (introActive) {
    return (
      introStartLineLength +
      (targetScale - introStartLineLength) * introProgress
    );
  }

  return targetScale;
};

function RadiatingBackground() {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const spinLayerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const lineGrowthMultiplierRef = useRef(INTRO_TARGET_LINE_SCALE);
  const introActiveRef = useRef(true);
  const introFrameRef = useRef<number | null>(null);
  const introProgressRef = useRef(0);
  const introRotationOffsetRef = useRef(0);
  const dotLengthMorphFrameRef = useRef<number | null>(null);
  const dotLengthVariationMixRef = useRef(1);
  const dotLengthPatternOffsetRef = useRef(0);
  const hasSeenPathnameRef = useRef(false);
  const initialThemeIntroPending = useStore(
    (state) => state.initialThemeIntroPending,
  );
  const hidePageContent = useStore((state) => state.hidePageContent);
  const showPageContent = useStore((state) => state.showPageContent);
  const revealPageContent = useStore((state) => state.revealPageContent);
  const [baseLineCount, setBaseLineCount] = useState(220);
  const [showEnterButton, setShowEnterButton] = useState(true);
  const variant: RadiatingVariant = 'variable-dots';

  const lineCount = Math.min(MAX_LINE_COUNT, Math.max(48, baseLineCount));

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const updateLineCount = () => {
      const computedStyles = getComputedStyle(root);
      const rawGap = computedStyles.getPropertyValue('--rb-line-gap').trim();
      const parsedGap = Number.parseFloat(rawGap);
      const fallbackGap = DEFAULT_LINE_GAP;
      const gap =
        Number.isFinite(parsedGap) && parsedGap > 0 ? parsedGap : fallbackGap;
      const circumference = 2 * Math.PI * EDGE_DISTANCE;
      const computedCount = Math.round(circumference / gap);
      const clampedCount = Math.min(720, Math.max(48, computedCount));

      setBaseLineCount(clampedCount);
    };

    updateLineCount();
    window.addEventListener('resize', updateLineCount, { passive: true });

    const observer = new MutationObserver(updateLineCount);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      window.removeEventListener('resize', updateLineCount);
      observer.disconnect();
    };
  }, []);

  const lineDescriptors = useMemo<RadiatingLineDescriptor[]>(
    () =>
      Array.from({ length: lineCount }, (_, index) => {
        const angle = (index / lineCount) * Math.PI * 2;
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        const baseToScale =
          EDGE_DISTANCE / Math.max(Math.abs(dx), Math.abs(dy), 0.0001);

        // Subtle angular asymmetry makes rotation perceptible on iOS Safari.
        const fullScale = baseToScale * (1 + 0.025 * Math.sin(index * 0.39));

        return {
          dx,
          dy,
          fullScale,
          index,
          opacity: 0.82 + 0.18 * (0.5 + 0.5 * Math.sin(index * 0.61)),
        };
      }),
    [lineCount],
  );

  const applyLineGeometry = useStableEvent(() => {
    const introStartLineLength = getIntroStartLineLength();

    for (let index = 0; index < lineDescriptors.length; index += 1) {
      const descriptor = lineDescriptors[index];
      if (!descriptor) continue;

      // Standard keeps full-length spokes; the dotted presets blend into the
      // variable-length pattern and can be re-shaped by CHANGE LENGTHS.
      const scale = getRadiatingLineScale(
        descriptor,
        variant,
        dotLengthVariationMixRef.current,
        dotLengthPatternOffsetRef.current,
        lineGrowthMultiplierRef.current,
        introStartLineLength,
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
    lineRefs.current.length = lineDescriptors.length;
    dotRefs.current.length = lineDescriptors.length;
    applyLineGeometry();
  }, [applyLineGeometry, lineDescriptors, variant]);

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

    const animate = (now: number) => {
      if (!lastTimestamp) {
        lastTimestamp = now;
      }

      const deltaMs = now - lastTimestamp;
      lastTimestamp = now;
      rotation = (rotation + deltaMs * baseDegreesPerMs) % 360;
      const degrees = rotation + introRotationOffsetRef.current;

      spinLayer.style.transform = `translate3d(-50%, -50%, 0) rotate(${degrees}deg)`;
      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
      spinLayer.style.transform = 'translate3d(-50%, -50%, 0) rotate(0deg)';
    };
  }, []);

  useEffect(() => {
    const introAnimationFrameRef = introFrameRef;
    const dotLengthAnimationFrameRef = dotLengthMorphFrameRef;

    return () => {
      if (introAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(introAnimationFrameRef.current);
      }
      if (dotLengthAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(dotLengthAnimationFrameRef.current);
      }
    };
  }, []);

  // Only the first matching theme on initial site load should gate content
  // behind the intro. Later theme switches should show the background directly.
  useEffect(() => {
    if (initialThemeIntroPending) {
      hidePageContent();
      setShowEnterButton(true);
      prepareRadiatingIntro({
        applyLineGeometry,
        introActiveRef,
        introFrameRef,
        introProgressRef,
        introRotationOffsetRef,
        lineGrowthMultiplierRef,
      });
    } else {
      setShowEnterButton(false);
      introActiveRef.current = false;
      introProgressRef.current = 1;
      introRotationOffsetRef.current = 0;
      lineGrowthMultiplierRef.current = INTRO_TARGET_LINE_SCALE;
      applyLineGeometry();
    }

    return () => {
      if (introFrameRef.current !== null) {
        window.cancelAnimationFrame(introFrameRef.current);
        introFrameRef.current = null;
      }

      showPageContent();
    };
  }, [
    applyLineGeometry,
    hidePageContent,
    initialThemeIntroPending,
    showPageContent,
  ]);

  const handleEnter = useCallback(() => {
    setShowEnterButton(false);
    startRadiatingIntro({
      applyLineGeometry,
      introActiveRef,
      introFrameRef,
      introProgressRef,
      introRotationOffsetRef,
      lineGrowthMultiplierRef,
      onComplete: revealPageContent,
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

  // Route changes reshuffle the dotted spoke lengths so each page lands on a
  // slightly different composition without restarting the background.
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
                  variant,
                  dotLengthVariationMixRef.current,
                  dotLengthPatternOffsetRef.current,
                  lineGrowthMultiplierRef.current,
                  renderIntroStartLineLength,
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
      {showEnterButton && (
        <IntroEnterButton onClick={handleEnter} />
      )}
    </>
  );
}

function SegmentsBackground() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let instance: p5 | null = null;
    let isDisposed = false;

    const init = async () => {
      const host = hostRef.current;
      if (!host) return;

      const [{ default: P5 }, { createSegmentsSketch, SEGMENTS_DEFAULT_PARAMS }] =
        await Promise.all([import('p5'), import('./segmentsSketch')]);
      if (isDisposed || !hostRef.current) return;

      instance = new P5(
        createSegmentsSketch({
          host,
          canvasClassName: styles.segmentsCanvas,
          params: SEGMENTS_DEFAULT_PARAMS,
        }),
      );
    };

    init();

    return () => {
      isDisposed = true;
      instance?.remove();
      instance = null;
    };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const fromScale = 1;
    const toScale = 0.5;
    const isPortrait =
      window.matchMedia?.('(orientation: portrait)').matches ??
      window.innerHeight > window.innerWidth;
    const durationMs = isPortrait
      ? SEGMENTS_SCALE_DURATION_PORTRAIT_MS
      : SEGMENTS_SCALE_DURATION_MS;
    let frameId = 0;
    let startTime = 0;

    const applyScale = (scale: number) => {
      host.style.transform = `translate3d(-50%, -50%, 0) scale(${scale})`;
    };

    applyScale(fromScale);

    const animate = (timestamp: number) => {
      if (!startTime) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const scale = fromScale + (toScale - fromScale) * progress;

      applyScale(scale);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
      host.style.transform = `translate3d(-50%, -50%, 0) scale(${fromScale})`;
    };
  }, []);

  return (
    <div
      className={`${styles.root} ${styles.segmentsViewport}`}
      data-version="segments"
      aria-hidden="true"
    >
      <div ref={hostRef} className={styles.segmentsRoot} />
    </div>
  );
}

function KusamaBackground() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let instance: p5 | null = null;
    let isDisposed = false;

    const init = async () => {
      const host = rootRef.current;
      if (!host) return;

      const [{ default: P5 }, { createKusamaSketch, KUSAMA_DEFAULT_PARAMS }] =
        await Promise.all([import('p5'), import('./kusamaSketch')]);
      if (isDisposed || !rootRef.current) return;

      instance = new P5(
        createKusamaSketch({
          host,
          canvasClassName: styles.kusamaCanvas,
          params: KUSAMA_DEFAULT_PARAMS,
        }),
      );
    };

    init();

    return () => {
      isDisposed = true;
      instance?.remove();
      instance = null;
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${styles.kusamaRoot}`}
      data-version="kusama"
      aria-hidden="true"
    />
  );
}

function BirdsBackground({ densityScale = 1 }: { densityScale?: number }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [sceneColors, setSceneColors] = useState({
    background: '#FFFFFF',
    bird: '#000000',
  });

  useEffect(() => {
    const host = rootRef.current;
    if (!host) return;

    const updateColors = () => {
      const styles = getComputedStyle(host);
      const background =
        styles.getPropertyValue('--be-birds-bg-color').trim() ||
        styles.getPropertyValue('--theme-bg').trim() ||
        '#FFFFFF';
      const bird =
        styles.getPropertyValue('--be-birds-color').trim() ||
        styles.getPropertyValue('--theme-type').trim() ||
        '#000000';

      setSceneColors((previous) => {
        if (previous.background === background && previous.bird === bird) {
          return previous;
        }

        return {
          background,
          bird,
        };
      });
    };

    updateColors();
    window.addEventListener('resize', updateColors, { passive: true });

    const observer = new MutationObserver(updateColors);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      window.removeEventListener('resize', updateColors);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div
        ref={rootRef}
        className={`${styles.root} ${styles.birdsRoot}`}
        data-version="birds"
        aria-hidden="true"
      >
        <BirdsScene
          className={styles.birdsCanvas}
          backgroundColor={sceneColors.background}
          birdColor={sceneColors.bird}
          densityScale={densityScale}
        />
      </div>
    </>
  );
}

export default function BackgroundEffects({
  version,
  densityScale,
}: BackgroundEffectsProps) {
  useEffect(() => {
    if (!isIosSafari()) return;

    const root = document.documentElement;
    const viewport = window.visualViewport;
    let maxHeight = 0;
    let maxWidth = 0;
    let lastOrientation: 'portrait' | 'landscape' | null = null;

    const update = () => {
      const width = Math.round(viewport?.width ?? window.innerWidth);
      const height = Math.round(viewport?.height ?? window.innerHeight);
      const offsetTop = Math.round(viewport?.offsetTop ?? 0);
      const orientation: 'portrait' | 'landscape' =
        width >= height ? 'landscape' : 'portrait';

      if (lastOrientation && orientation !== lastOrientation) {
        maxHeight = 0;
        maxWidth = 0;
      }
      lastOrientation = orientation;

      maxHeight = Math.max(maxHeight, height + offsetTop);
      maxWidth = Math.max(maxWidth, width);

      root.style.setProperty(IOS_IMMERSIVE_HEIGHT_VAR, `${maxHeight}px`);
      root.style.setProperty(IOS_IMMERSIVE_WIDTH_VAR, `${maxWidth}px`);
    };

    update();

    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('orientationchange', update, { passive: true });
    window.addEventListener('pageshow', update);

    return () => {
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      window.removeEventListener('pageshow', update);
    };
  }, []);

  if (version === 'birds') {
    return <BirdsBackground densityScale={densityScale} />;
  }

  if (version === 'kusama') {
    return <KusamaBackground />;
  }

  if (version === 'segments') {
    return <SegmentsBackground />;
  }

  return <RadiatingBackground />;
}
