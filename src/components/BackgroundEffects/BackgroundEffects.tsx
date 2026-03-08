'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type p5 from 'p5';
import dynamic from 'next/dynamic';
import styles from './BackgroundEffects.module.sass';
import {
  createSegmentsSketch,
  SEGMENTS_DEFAULT_PARAMS,
} from './segmentsSketch';
import { createKusamaSketch, KUSAMA_DEFAULT_PARAMS } from './kusamaSketch';
import DotsScene from './dotsScene';

const BirdsScene = dynamic(() => import('./birdsScene'), { ssr: false });

const VIEWBOX_SIZE = 1200;
const CENTER = VIEWBOX_SIZE / 2;
const EDGE_DISTANCE = VIEWBOX_SIZE / 2;
const DEFAULT_LINE_GAP = 18;
const DEFAULT_ROTATION_DURATION_MS = 72000;
const SEGMENTS_SCALE_DURATION_MS = 90000;
const SEGMENTS_SCALE_DURATION_PORTRAIT_MS = 45000;
const BIRDS_SKY_VARIATIONS = ['morning'] as const;
const IOS_IMMERSIVE_HEIGHT_VAR = '--be-ios-immersive-height';
const IOS_IMMERSIVE_WIDTH_VAR = '--be-ios-immersive-width';

const formatLocalTime = () =>
  new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date());

const isIosSafari = () => {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent;
  const isIosDevice =
    /iP(hone|ad|od)/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isWebKit = /WebKit/i.test(ua);
  const isNonSafariBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|YaBrowser/i.test(
    ua,
  );

  return isIosDevice && isWebKit && !isNonSafariBrowser;
};

const getSkyVariationForHour = (hour: number) => {
  if (hour >= 4 && hour < 5) return 'morning';
  if (hour >= 5 && hour < 10) return 'dawn';
  if (hour >= 10 && hour < 17) return 'noon';
  if (hour >= 17 && hour < 19) return 'sunset';
  if (hour >= 19 && hour < 21) return 'dusk';
  return 'evening';
};

type BackgroundEffectsProps = {
  version: 'radiating' | 'segments' | 'kusama' | 'dots' | 'birds';
  densityScale?: number;
  layer?: 'background' | 'overlay';
  active?: boolean;
};

function RadiatingBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const spinLayerRef = useRef<HTMLDivElement>(null);
  const [lineCount, setLineCount] = useState(220);

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

      setLineCount(clampedCount);
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

  const radialLines = useMemo(
    () =>
      Array.from({ length: lineCount }, (_, index) => {
        const angle = (index / lineCount) * Math.PI * 2;
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        const baseToScale =
          EDGE_DISTANCE / Math.max(Math.abs(dx), Math.abs(dy), 0.0001);

        const fromScale = 0;
        // Subtle angular asymmetry makes rotation perceptible on iOS Safari.
        const toScale = baseToScale * (1 + 0.025 * Math.sin(index * 0.39));

        return {
          x1: CENTER + dx * fromScale,
          y1: CENTER + dy * fromScale,
          x2: CENTER + dx * toScale,
          y2: CENTER + dy * toScale,
          opacity: 0.82 + 0.18 * (0.5 + 0.5 * Math.sin(index * 0.61)),
        };
      }),
    [lineCount],
  );

  useEffect(() => {
    const root = rootRef.current;
    const spinLayer = spinLayerRef.current;
    if (!root || !spinLayer) return;

    const rawDuration = getComputedStyle(root)
      .getPropertyValue('--rb-rotation-duration')
      .trim();
    const parsedDuration = Number.parseFloat(rawDuration);
    const isMs = rawDuration.endsWith('ms');
    const durationMs = Number.isFinite(parsedDuration)
      ? isMs
        ? parsedDuration
        : parsedDuration * 1000
      : DEFAULT_ROTATION_DURATION_MS;
    const safeDurationMs = Math.max(1, durationMs);

    let frameId = 0;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = (elapsed % safeDurationMs) / safeDurationMs;
      const degrees = progress * 360;

      spinLayer.style.transform = `translate3d(-50%, -50%, 0) rotate(${degrees}deg)`;
      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
      spinLayer.style.transform = 'translate3d(-50%, -50%, 0) rotate(0deg)';
    };
  }, []);

  return (
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
            {radialLines.map((line, index) => (
              <line
                key={index}
                className={styles.line}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                opacity={line.opacity}
              />
            ))}
          </g>
        </svg>
      </div>
    </div>
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

      const { default: P5 } = await import('p5');
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

      const { default: P5 } = await import('p5');
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

function DotsBackground({
  densityScale = 1,
  layer = 'background',
  active = true,
}: {
  densityScale?: number;
  layer?: 'background' | 'overlay';
  active?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef(0);
  const [disableInputEffects, setDisableInputEffects] = useState(false);
  const [sceneColors, setSceneColors] = useState({
    background: '#050709',
    dotColors: ['#ffffff'],
    dotSize: 0.5,
  });

  useEffect(() => {
    const isTouchDevice =
      window.matchMedia('(hover: none), (pointer: coarse)').matches ||
      (navigator.maxTouchPoints ?? 0) > 0;
    setDisableInputEffects(isTouchDevice);
  }, []);

  useEffect(() => {
    const host = rootRef.current;
    if (!host) return;

    const updateColors = () => {
      const styles = getComputedStyle(host);
      const background =
        styles.getPropertyValue('--be-dots-bg-color').trim() ||
        styles.getPropertyValue('--theme-bg').trim() ||
        '#050709';
      const dot =
        styles.getPropertyValue('--be-dots-dot-color').trim() ||
        styles.getPropertyValue('--theme-type').trim() ||
        '#ffffff';
      setSceneColors((previous) => {
        if (
          previous.background === background &&
          previous.dotColors[0] === dot &&
          previous.dotSize === 0.5
        ) {
          return previous;
        }

        return {
          background,
          dotColors: [dot],
          dotSize: 0.5,
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

  useEffect(() => {
    if (disableInputEffects) {
      scrollProgressRef.current = 0;
      return;
    }

    const updateScrollProgress = () => {
      const root = document.documentElement;
      const viewportHeight = root.clientHeight;
      const maxScroll = Math.max(1, root.scrollHeight - viewportHeight);
      const progress = window.scrollY / maxScroll;
      scrollProgressRef.current = Math.max(0, Math.min(1, progress));
    };

    updateScrollProgress();

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('orientationchange', updateScrollProgress, {
      passive: true,
    });

    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('orientationchange', updateScrollProgress);
    };
  }, [disableInputEffects]);

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${styles.dotsRoot} ${
        layer === 'overlay' ? styles.overlayRoot : ''
      } ${layer === 'overlay' && active ? styles.overlayVisible : ''}`}
      data-version="dots"
      aria-hidden="true"
    >
      <DotsScene
        className={styles.dotsCanvas}
        backgroundColor={sceneColors.background}
        dotColors={sceneColors.dotColors}
        dotSize={sceneColors.dotSize}
        densityScale={densityScale}
        drawBackground={layer !== 'overlay'}
        scrollProgressRef={scrollProgressRef}
        disableInputs={disableInputEffects}
      />
    </div>
  );
}

function BirdsBackground({ densityScale = 1 }: { densityScale?: number }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [sceneColors, setSceneColors] = useState({
    background: '#FFFFFF',
    bird: '#000000',
    skyVariation: 'morning',
  });
  const [testingSkyVariation, setTestingSkyVariation] = useState<string | null>(
    null,
  );
  const [localTime, setLocalTime] = useState('--:--:--');
  const [localSkyVariation, setLocalSkyVariation] = useState('noon');

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
      const skyVariation = 'morning';

      setSceneColors((previous) => {
        if (
          previous.background === background &&
          previous.bird === bird &&
          previous.skyVariation === skyVariation
        ) {
          return previous;
        }

        return {
          background,
          bird,
          skyVariation,
        };
      });
    };

    updateColors();
    window.addEventListener('resize', updateColors, { passive: true });

    const observer = new MutationObserver(updateColors);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-sky-variation'],
    });

    return () => {
      window.removeEventListener('resize', updateColors);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLocalTime(formatLocalTime());
      setLocalSkyVariation(getSkyVariationForHour(now.getHours()));
    };
    updateTime();

    const intervalId = window.setInterval(updateTime, 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const activeSkyVariation = testingSkyVariation ?? sceneColors.skyVariation;
  const buttonLabel =
    activeSkyVariation === localSkyVariation
      ? localTime + ' ' + activeSkyVariation
      : activeSkyVariation;

  const handleToggleSkyVariation = () => {
    const currentIndex = BIRDS_SKY_VARIATIONS.indexOf(
      activeSkyVariation as (typeof BIRDS_SKY_VARIATIONS)[number],
    );
    const safeCurrentIndex = currentIndex >= 0 ? currentIndex : -1;
    const nextIndex = (safeCurrentIndex + 1) % BIRDS_SKY_VARIATIONS.length;
    const nextVariation = BIRDS_SKY_VARIATIONS[nextIndex];
    setTestingSkyVariation(nextVariation);
    document.body?.setAttribute('data-sky-variation', nextVariation);
  };

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
          skyVariation={activeSkyVariation}
          densityScale={densityScale}
        />
      </div>
      {/* <button
        type="button"
        className={`${styles.birdsVariationToggle} cursorInteract`}
        onClick={handleToggleSkyVariation}
      >
        {buttonLabel}
      </button> */}
    </>
  );
}

export default function BackgroundEffects({
  version,
  densityScale,
  layer,
  active,
}: BackgroundEffectsProps) {
  useEffect(() => {
    if (layer === 'overlay' || !isIosSafari()) return;

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
  }, [layer]);

  if (version === 'birds') {
    return <BirdsBackground densityScale={densityScale} />;
  }

  if (version === 'dots') {
    return (
      <DotsBackground
        densityScale={densityScale}
        layer={layer}
        active={active}
      />
    );
  }

  if (version === 'kusama') {
    return <KusamaBackground />;
  }

  if (version === 'segments') {
    return <SegmentsBackground />;
  }

  return <RadiatingBackground />;
}
