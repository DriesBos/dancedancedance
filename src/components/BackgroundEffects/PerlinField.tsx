'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/store';
import { createAdaptiveDprController } from './adaptiveDpr';
import IntroEnterButton from './IntroEnterButton';
import styles from './PerlinField.module.sass';

const MOBILE_BREAKPOINT_PX = 770;
const INTRO_EXPANSION_DURATION_MS = 1500;
const INTRO_REVEAL_DELAY_MS = 880;
const TAU = Math.PI * 2;

type IntroState = 'idle' | 'playing' | 'complete';

type CircleTable = {
  cos: Float32Array;
  sin: Float32Array;
};

const circleTableCache = new Map<number, CircleTable>();

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const lerp = (start: number, end: number, amount: number) =>
  start + (end - start) * amount;

const fract = (value: number) => value - Math.floor(value);

const smoothstep = (value: number) => value * value * (3 - 2 * value);

const getAdaptiveDprBounds = () => {
  const deviceDpr =
    typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const maxDpr = Math.min(deviceDpr, 1.2);
  const minDpr = Math.min(0.65, maxDpr);

  return {
    minDpr,
    maxDpr,
  };
};

const getCircleTable = (stepCount: number): CircleTable => {
  const cached = circleTableCache.get(stepCount);
  if (cached) {
    return cached;
  }

  const cos = new Float32Array(stepCount + 1);
  const sin = new Float32Array(stepCount + 1);

  for (let index = 0; index <= stepCount; index += 1) {
    const angle = (index / stepCount) * TAU;
    cos[index] = Math.cos(angle);
    sin[index] = Math.sin(angle);
  }

  const table = { cos, sin };
  circleTableCache.set(stepCount, table);

  return table;
};

const hash3D = (x: number, y: number, z: number) =>
  fract(Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123);

const valueNoise3D = (x: number, y: number, z: number) => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;

  const sx = smoothstep(fx);
  const sy = smoothstep(fy);
  const sz = smoothstep(fz);

  const n000 = hash3D(ix, iy, iz);
  const n100 = hash3D(ix + 1, iy, iz);
  const n010 = hash3D(ix, iy + 1, iz);
  const n110 = hash3D(ix + 1, iy + 1, iz);
  const n001 = hash3D(ix, iy, iz + 1);
  const n101 = hash3D(ix + 1, iy, iz + 1);
  const n011 = hash3D(ix, iy + 1, iz + 1);
  const n111 = hash3D(ix + 1, iy + 1, iz + 1);

  const nx00 = lerp(n000, n100, sx);
  const nx10 = lerp(n010, n110, sx);
  const nx01 = lerp(n001, n101, sx);
  const nx11 = lerp(n011, n111, sx);
  const nxy0 = lerp(nx00, nx10, sy);
  const nxy1 = lerp(nx01, nx11, sy);

  return lerp(nxy0, nxy1, sz);
};

const fbm3D = (x: number, y: number, z: number, octaves = 4) => {
  let amplitude = 0.5;
  let frequency = 1;
  let value = 0;
  let weight = 0;

  for (let octave = 0; octave < octaves; octave += 1) {
    value += valueNoise3D(x * frequency, y * frequency, z * frequency) * amplitude;
    weight += amplitude;
    frequency *= 2;
    amplitude *= 0.5;
  }

  return weight > 0 ? value / weight : 0;
};

type RgbaColor = {
  r: number;
  g: number;
  b: number;
};

const hexToRgb = (hex: string): RgbaColor => {
  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;

  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
};

const mixColor = (start: RgbaColor, end: RgbaColor, amount: number): RgbaColor => ({
  r: Math.round(lerp(start.r, end.r, amount)),
  g: Math.round(lerp(start.g, end.g, amount)),
  b: Math.round(lerp(start.b, end.b, amount)),
});

const mixThreeStops = (
  amount: number,
  start: RgbaColor,
  middle: RgbaColor,
  end: RgbaColor,
) => {
  if (amount <= 0.5) {
    return mixColor(start, middle, amount / 0.5);
  }

  return mixColor(middle, end, (amount - 0.5) / 0.5);
};

const toRgba = (color: RgbaColor, alpha: number) =>
  `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;

const renderPerlinField = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeSeconds: number,
) => {
  const minDimension = Math.min(width, height);
  const maxDimension = Math.max(width, height);
  const isMobile = width <= MOBILE_BREAKPOINT_PX;
  const ringCount = isMobile ? 150 : maxDimension > 1500 ? 240 : 200;
  const radialSteps = isMobile ? 150 : 196;
  const { cos, sin } = getCircleTable(radialSteps);

  const centerX = width * 0.5;
  const centerY = height * 0.5;
  const pulse =
    0.5 +
    0.35 * Math.sin(timeSeconds * 0.52) +
    0.15 * Math.sin(timeSeconds * 0.17 + 1.1);
  const portalHalfWidth = minDimension * (isMobile ? 0.09 : 0.065);
  const portalHalfHeight = portalHalfWidth * (isMobile ? 1 : 0.88);
  const innerRadius =
    Math.hypot(portalHalfWidth, portalHalfHeight) + minDimension * (0.05 + pulse * 0.018);
  const outerRadius = Math.hypot(width * 0.62, height * 0.62);
  const centerColor = hexToRgb('#ffd4be');
  const middleColor = hexToRgb('#ff5f86');
  const edgeColor = hexToRgb('#54153f');

  context.clearRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';
  context.fillStyle = '#050109';
  context.fillRect(0, 0, width, height);

  const haloGradient = context.createRadialGradient(
    centerX,
    centerY,
    innerRadius * 0.25,
    centerX,
    centerY,
    outerRadius,
  );
  haloGradient.addColorStop(0, 'rgba(255, 212, 190, 0.95)');
  haloGradient.addColorStop(0.12, 'rgba(255, 166, 125, 0.82)');
  haloGradient.addColorStop(0.28, 'rgba(255, 95, 134, 0.26)');
  haloGradient.addColorStop(0.62, 'rgba(84, 21, 63, 0.08)');
  haloGradient.addColorStop(1, 'rgba(5, 1, 9, 0)');
  context.fillStyle = haloGradient;
  context.fillRect(0, 0, width, height);

  const vignette = context.createRadialGradient(
    centerX,
    centerY,
    minDimension * 0.35,
    centerX,
    centerY,
    outerRadius * 1.12,
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(0.7, 'rgba(0, 0, 0, 0.14)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);

  context.lineCap = 'round';
  context.lineJoin = 'round';

  for (let ringIndex = 0; ringIndex < ringCount; ringIndex += 1) {
    const amount = ringIndex / Math.max(1, ringCount - 1);
    const radialMix = amount * amount;
    const baseRadius =
      innerRadius + Math.pow(amount, 1.22) * Math.max(0, outerRadius - innerRadius);
    const force = minDimension * (0.006 + radialMix * 0.042);
    const turbulence = 0.72 + radialMix * 1.55;
    const depth = timeSeconds * 0.06 + amount * 3.4;
    const angularDrift = 0.12 * Math.sin(timeSeconds * 0.06 + amount * 9.5);
    const lineWidth =
      (amount < 0.14 ? 1.08 : amount < 0.62 ? 0.78 : 0.62) * (isMobile ? 0.95 : 1);
    const alpha = clamp(0.045 + (1 - amount) * 0.26 + pulse * 0.02, 0.04, 0.34);
    const color = mixThreeStops(amount, centerColor, middleColor, edgeColor);

    context.strokeStyle = toRgba(color, alpha);
    context.lineWidth = lineWidth;
    context.beginPath();

    for (let stepIndex = 0; stepIndex <= radialSteps; stepIndex += 1) {
      const cosTheta = cos[stepIndex];
      const sinTheta = sin[stepIndex];
      const angle = (stepIndex / radialSteps) * TAU + angularDrift;
      const swirl = Math.sin(angle * 6 + timeSeconds * 0.24 + amount * 13) * force * 0.032;
      const noiseSample = fbm3D(
        cosTheta * turbulence + amount * 0.6 + 4.2,
        sinTheta * turbulence - amount * 0.45 + 9.3,
        depth,
      );
      const ridge = Math.abs(noiseSample * 2 - 1);
      const displacement = ((noiseSample - 0.5) * 2 + (ridge - 0.5) * 0.55) * force;
      const radius = baseRadius + displacement + swirl;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      if (stepIndex === 0) {
        context.moveTo(x, y);
        continue;
      }

      context.lineTo(x, y);
    }

    context.stroke();

    if (ringIndex % (isMobile ? 18 : 15) === 0) {
      context.strokeStyle = toRgba(color, alpha * 0.4);
      context.lineWidth = lineWidth * 1.8;
      context.stroke();
    }
  }
};

export default function PerlinField() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const resizeFrameRef = useRef<number | null>(null);
  const revealTimeoutRef = useRef<number | null>(null);
  const completeTimeoutRef = useRef<number | null>(null);
  const introStateRef = useRef<IntroState>('complete');
  const initialThemeIntroPending = useStore(
    (state) => state.initialThemeIntroPending,
  );
  const hidePageContent = useStore((state) => state.hidePageContent);
  const revealPageContent = useStore((state) => state.revealPageContent);
  const [introState, setIntroState] = useState<IntroState>('complete');
  const [showEnterButton, setShowEnterButton] = useState(false);

  const clearIntroTimers = useCallback(() => {
    if (revealTimeoutRef.current !== null) {
      window.clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }

    if (completeTimeoutRef.current !== null) {
      window.clearTimeout(completeTimeoutRef.current);
      completeTimeoutRef.current = null;
    }
  }, []);

  const syncIntroState = useCallback(() => {
    clearIntroTimers();

    if (initialThemeIntroPending) {
      introStateRef.current = 'idle';
      setIntroState('idle');
      setShowEnterButton(true);
      hidePageContent();
      return;
    }

    introStateRef.current = 'complete';
    setIntroState('complete');
    setShowEnterButton(false);
  }, [clearIntroTimers, hidePageContent, initialThemeIntroPending]);

  const handleEnter = useCallback(() => {
    if (introStateRef.current !== 'idle') {
      return;
    }

    introStateRef.current = 'playing';
    setIntroState('playing');
    setShowEnterButton(false);

    revealTimeoutRef.current = window.setTimeout(() => {
      revealPageContent();
      revealTimeoutRef.current = null;
    }, INTRO_REVEAL_DELAY_MS);

    completeTimeoutRef.current = window.setTimeout(() => {
      introStateRef.current = 'complete';
      setIntroState('complete');
      completeTimeoutRef.current = null;
    }, INTRO_EXPANSION_DURATION_MS);
  }, [revealPageContent]);

  useEffect(() => {
    syncIntroState();
  }, [syncIntroState]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) {
      return;
    }

    const context = canvas.getContext('2d', {
      alpha: false,
    });
    if (!context) {
      return;
    }

    const dprBounds = getAdaptiveDprBounds();
    const dprController = createAdaptiveDprController({
      minDpr: dprBounds.minDpr,
      maxDpr: dprBounds.maxDpr,
      initialDpr: dprBounds.maxDpr,
      step: 0.05,
      lowerFpsThreshold: 42,
      upperFpsThreshold: 56,
      minSamplesBeforeAdjust: 18,
      cooldownMs: 1400,
    });

    let viewportWidth = 0;
    let viewportHeight = 0;

    const resizeCanvas = () => {
      const nextWidth = Math.max(1, Math.round(root.clientWidth));
      const nextHeight = Math.max(1, Math.round(root.clientHeight));
      const nextDpr = dprController.getCurrentDpr();
      const pixelWidth = Math.max(1, Math.round(nextWidth * nextDpr));
      const pixelHeight = Math.max(1, Math.round(nextHeight * nextDpr));

      viewportWidth = nextWidth;
      viewportHeight = nextHeight;

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }

      context.setTransform(nextDpr, 0, 0, nextDpr, 0, 0);
    };

    const scheduleResize = () => {
      if (resizeFrameRef.current !== null) {
        window.cancelAnimationFrame(resizeFrameRef.current);
      }

      resizeFrameRef.current = window.requestAnimationFrame(() => {
        resizeFrameRef.current = null;
        const bounds = getAdaptiveDprBounds();
        dprController.setBounds(bounds.minDpr, bounds.maxDpr, performance.now());
        resizeCanvas();
      });
    };

    const animate = (nowMs: number) => {
      const dprObservation = dprController.observeFrame(nowMs);
      if (dprObservation?.nextDpr) {
        resizeCanvas();
      }

      renderPerlinField(context, viewportWidth, viewportHeight, nowMs * 0.001);
      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    resizeCanvas();
    animationFrameRef.current = window.requestAnimationFrame(animate);
    window.addEventListener('resize', scheduleResize);

    return () => {
      clearIntroTimers();
      window.removeEventListener('resize', scheduleResize);

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (resizeFrameRef.current !== null) {
        window.cancelAnimationFrame(resizeFrameRef.current);
        resizeFrameRef.current = null;
      }
    };
  }, [clearIntroTimers]);

  return (
    <>
      <div ref={rootRef} className={styles.root} data-intro-state={introState}>
        <canvas ref={canvasRef} className={styles.canvas} />
        <div className={styles.portal} aria-hidden="true">
          <div className={styles.portalGlow} />
          <div className={styles.portalPanel} />
        </div>
      </div>
      {showEnterButton && <IntroEnterButton onClick={handleEnter} />}
    </>
  );
}
