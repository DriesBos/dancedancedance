'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type p5 from 'p5';
import styles from './BackgroundEffects.module.sass';
import {
  createSegmentsSketch,
  SEGMENTS_DEFAULT_PARAMS,
} from './segmentsSketch';
import { createKusamaSketch, KUSAMA_DEFAULT_PARAMS } from './kusamaSketch';
import DotsScene from './dotsScene';
import BirdsScene from './birdsScene';

const VIEWBOX_SIZE = 1200;
const CENTER = VIEWBOX_SIZE / 2;
const EDGE_DISTANCE = VIEWBOX_SIZE / 2;
const DEFAULT_LINE_GAP = 18;
const DEFAULT_LINE_GAP_RADIANT_DARK = 9;
const DEFAULT_ROTATION_DURATION_MS = 72000;
const BIRDS_SKY_VARIATIONS = [
  'dawn',
  'noon',
  'sunset',
  'dusk',
  'evening',
  'morning',
] as const;

const formatLocalTime = () =>
  new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date());

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
  const [isRadiantDark, setIsRadiantDark] = useState(false);
  const idSeed = useId().replace(/:/g, '');
  const lineGradientId = `rb-line-gradient-${idSeed}`;
  const centerHaloGradientId = `rb-center-halo-${idSeed}`;
  const paintFilterId = `rb-line-paint-${idSeed}`;
  const glowFilterId = `rb-line-glow-${idSeed}`;
  const paperNoiseFilterId = `rb-paper-noise-${idSeed}`;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const updateLineCount = () => {
      const computedStyles = getComputedStyle(root);
      const rawGap = computedStyles.getPropertyValue('--rb-line-gap').trim();
      const parsedGap = Number.parseFloat(rawGap);
      const fallbackGap =
        document.body.dataset.theme === 'RADIANT DARK'
          ? DEFAULT_LINE_GAP_RADIANT_DARK
          : DEFAULT_LINE_GAP;
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

        if (!isRadiantDark) {
          const fromScale = 0;
          // Subtle angular asymmetry makes rotation perceptible on iOS Safari.
          const toScale = baseToScale * (1 + 0.025 * Math.sin(index * 0.39));

          return {
            x1: CENTER + dx * fromScale,
            y1: CENTER + dy * fromScale,
            x2: CENTER + dx * toScale,
            y2: CENTER + dy * toScale,
            opacity: 0.82 + 0.18 * (0.5 + 0.5 * Math.sin(index * 0.61)),
            glowOpacity: 0,
            widthScale: 1,
          };
        }

        // The dark radiant variant uses slight endpoint jitter and width variance
        // to mimic hand-painted metallic lines.
        const fromScale = 18 + 14 * (0.5 + 0.5 * Math.sin(index * 1.37));
        const lengthScale =
          0.84 + 0.2 * (0.5 + 0.5 * Math.sin(index * 0.29 + index * 0.013));
        const toScale = baseToScale * lengthScale;
        const px = -dy;
        const py = dx;
        const tangentialJitter = 1.6 * Math.sin(index * 0.91);
        const perpendicularJitter = 2.4 * Math.cos(index * 0.63);
        const widthScale =
          0.78 + 0.48 * (0.5 + 0.5 * Math.cos(index * 0.73 + 0.8));

        return {
          x1: CENTER + dx * fromScale + px * tangentialJitter * 0.35,
          y1: CENTER + dy * fromScale + py * tangentialJitter * 0.35,
          x2: CENTER + dx * toScale + px * perpendicularJitter,
          y2: CENTER + dy * toScale + py * perpendicularJitter,
          opacity:
            0.58 +
            0.37 *
              (0.5 + 0.5 * Math.sin(index * 0.61 + Math.sin(index * 0.17))),
          glowOpacity: 0.2 + 0.4 * (0.5 + 0.5 * Math.sin(index * 0.43 + 0.7)),
          widthScale,
        };
      }),
    [isRadiantDark, lineCount],
  );

  useEffect(() => {
    const updateThemeMode = () => {
      setIsRadiantDark(document.body.dataset.theme === 'RADIANT DARK');
    };

    updateThemeMode();
    const observer = new MutationObserver(updateThemeMode);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

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
          {isRadiantDark && (
            <defs>
              <radialGradient
                id={lineGradientId}
                cx="50%"
                cy="50%"
                r="72%"
                gradientUnits="userSpaceOnUse"
              >
                <stop
                  offset="0%"
                  stopColor="var(--rb-line-gradient-start, var(--rb-line-color))"
                />
                <stop
                  offset="18%"
                  stopColor="var(--rb-line-gradient-mid, var(--rb-line-color))"
                />
                <stop
                  offset="64%"
                  stopColor="var(--rb-line-gradient-end, var(--rb-line-color))"
                />
                <stop
                  offset="100%"
                  stopColor="var(--rb-line-gradient-tail, var(--rb-line-color))"
                />
              </radialGradient>
              <radialGradient
                id={centerHaloGradientId}
                cx="50%"
                cy="50%"
                r="50%"
              >
                <stop offset="0%" stopColor="rgba(0, 0, 0, 0)" />
                <stop
                  offset="62%"
                  stopColor="var(--rb-center-halo-color, var(--rb-line-color))"
                />
                <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
              </radialGradient>
              <filter
                id={paintFilterId}
                x="-28%"
                y="-28%"
                width="156%"
                height="156%"
                colorInterpolationFilters="sRGB"
              >
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.95"
                  numOctaves="2"
                  seed="14"
                  result="paintNoise"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="paintNoise"
                  scale="0.85"
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
              <filter
                id={glowFilterId}
                x="-36%"
                y="-36%"
                width="172%"
                height="172%"
                colorInterpolationFilters="sRGB"
              >
                <feGaussianBlur stdDeviation="1.25" />
              </filter>
              <filter
                id={paperNoiseFilterId}
                x="0%"
                y="0%"
                width="100%"
                height="100%"
              >
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.82"
                  numOctaves="2"
                  seed="11"
                  stitchTiles="stitch"
                />
              </filter>
            </defs>
          )}
          <rect
            className={styles.background}
            width={VIEWBOX_SIZE}
            height={VIEWBOX_SIZE}
          />
          {isRadiantDark && (
            <>
              <rect
                className={styles.paperNoise}
                width={VIEWBOX_SIZE}
                height={VIEWBOX_SIZE}
                filter={`url(#${paperNoiseFilterId})`}
              />
              <circle
                className={styles.centerHalo}
                cx={CENTER}
                cy={CENTER}
                r={40}
                fill={`url(#${centerHaloGradientId})`}
              />
              <circle
                className={styles.centerVoid}
                cx={CENTER}
                cy={CENTER}
                r={14}
              />
              <g className={styles.linesGlow} filter={`url(#${glowFilterId})`}>
                {radialLines.map((line, index) => (
                  <line
                    key={`glow-${index}`}
                    className={styles.line}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    strokeWidth={line.widthScale * 1.95}
                    opacity={line.glowOpacity}
                  />
                ))}
              </g>
              <g
                className={styles.linesDark}
                stroke={`url(#${lineGradientId})`}
                filter={`url(#${paintFilterId})`}
              >
                {radialLines.map((line, index) => (
                  <line
                    key={index}
                    className={styles.line}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    strokeWidth={line.widthScale}
                    opacity={line.opacity}
                  />
                ))}
              </g>
            </>
          )}
          {!isRadiantDark && (
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
          )}
        </svg>
      </div>
    </div>
  );
}

function SegmentsBackground() {
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

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${styles.segmentsRoot}`}
      data-version="segments"
      aria-hidden="true"
    />
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
    skyVariation: 'auto',
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
      const bodySkyVariation =
        document.body?.getAttribute('data-sky-variation')?.trim() ?? '';
      const cssSkyVariation = styles
        .getPropertyValue('--be-birds-sky-variation')
        .trim();
      const skyVariation = bodySkyVariation || cssSkyVariation || 'auto';

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
      <button
        type="button"
        className={`${styles.birdsVariationToggle} cursorInteract`}
        onClick={handleToggleSkyVariation}
      >
        {buttonLabel}
      </button>
    </>
  );
}

export default function BackgroundEffects({
  version,
  densityScale,
  layer,
  active,
}: BackgroundEffectsProps) {
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
