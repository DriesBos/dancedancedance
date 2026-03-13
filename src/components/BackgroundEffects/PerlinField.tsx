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

// Lets the contour field keep evolving over time. Keep this false while tuning
// shape/detail so the component renders once instead of repainting every frame.
const ENABLE_BACKGROUND_MOTION = false;
// Controls the slow "breathing" glow around the center portal only. The field
// can stay animated even if this is false.
const ENABLE_PORTAL_GLOW_PULSE = false;
// Controls the enter-square expansion into the page container. Set to false if
// you want Enter to reveal the page without the grow transition.
const ENABLE_INTRO_EXPANSION = false;

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
  const isMobile = width <= MOBILE_BREAKPOINT_PX;
  const ringCount = isMobile ? 180 : 240;
  const radialSteps = isMobile ? 320 : 512;
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
    Math.hypot(portalHalfWidth, portalHalfHeight) +
    minDimension * (0.032 + pulse * 0.012);
  const outerRadius = Math.hypot(width * 0.74, height * 0.74);
  const centerColor = hexToRgb('#fff1d7');
  const middleColor = hexToRgb('#ff2f85');
  const edgeColor = hexToRgb('#2d093a');

  context.clearRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';
  context.fillStyle = '#000000';
  context.fillRect(0, 0, width, height);

  const haloGradient = context.createRadialGradient(
    centerX,
    centerY,
    innerRadius * 0.55,
    centerX,
    centerY,
    outerRadius * 0.56,
  );
  haloGradient.addColorStop(0, 'rgba(255, 226, 192, 0.98)');
  haloGradient.addColorStop(0.12, 'rgba(255, 188, 149, 0.82)');
  haloGradient.addColorStop(0.24, 'rgba(255, 98, 139, 0.28)');
  haloGradient.addColorStop(0.52, 'rgba(73, 14, 48, 0.1)');
  haloGradient.addColorStop(1, 'rgba(5, 1, 9, 0)');
  context.fillStyle = haloGradient;
  context.fillRect(0, 0, width, height);

  const shadowGradient = context.createRadialGradient(
    centerX,
    centerY,
    innerRadius * 1.05,
    centerX,
    centerY,
    outerRadius * 0.95,
  );
  shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  shadowGradient.addColorStop(0.44, 'rgba(0, 0, 0, 0.1)');
  shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
  context.fillStyle = shadowGradient;
  context.fillRect(0, 0, width, height);

  const vignette = context.createRadialGradient(
    centerX,
    centerY,
    minDimension * 0.26,
    centerX,
    centerY,
    outerRadius * 1.08,
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(0.66, 'rgba(8, 0, 12, 0.3)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.72)');
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);

  context.lineCap = 'round';
  context.lineJoin = 'round';

  for (let ringIndex = 0; ringIndex < ringCount; ringIndex += 1) {
    const amount = ringIndex / Math.max(1, ringCount - 1);
    const normInc = amount * amount;
    const radialMix = Math.pow(amount, 1.08);
    const outerMountainMix = smoothstep(clamp((amount - 0.54) / 0.46, 0, 1));
    const ringRadius =
      innerRadius + radialMix * Math.max(0, outerRadius - innerRadius);
    const currentForce =
      minDimension *
      (0.012 + normInc * 0.04 + outerMountainMix * normInc * 0.22);
    const turbulence = 0.12 + normInc * 2.4;
    const chaos = 0.014 + outerMountainMix * 0.032;
    const symmetry = 0.14;
    const lineWidth = (amount < 0.24 ? 0.92 : amount < 0.7 ? 0.82 : 0.72) * (isMobile ? 0.94 : 1);
    const alpha = clamp(0.09 + (1 - normInc) * 0.42, 0.08, 0.52);
    const color = mixThreeStops(normInc, centerColor, middleColor, edgeColor);
    const shadowOffset =
      (0.24 + outerMountainMix * 1.35) * (isMobile ? 0.85 : 1);
    const pointCount = radialSteps + 1;
    const xPoints = new Float32Array(pointCount);
    const yPoints = new Float32Array(pointCount);

    for (let stepIndex = 0; stepIndex <= radialSteps; stepIndex += 1) {
      const ct = cos[stepIndex];
      const st = sin[stepIndex];
      const angle = (stepIndex / radialSteps) * TAU;
      const sampleX = ct + symmetry;
      const sampleY = st + symmetry;
      const macroNoise = fbm3D(
        turbulence * sampleX * 0.42 + 4.7,
        turbulence * sampleY * 0.42 + 9.1,
        ringIndex * chaos + timeSeconds * 0.04,
      );
      const ridgeNoise = fbm3D(
        turbulence * sampleX * 1.35 + 18.2,
        turbulence * sampleY * 1.35 + 27.5,
        ringIndex * chaos * 2.4 + 3.3,
      );
      const filamentNoise = fbm3D(
        turbulence * sampleX * 4.8 + 46.2,
        turbulence * sampleY * 4.8 + 31.4,
        ringIndex * chaos * 3.8 + 7.1,
      );
      const sectorNoise = fbm3D(
        ct * 0.72 + 71.2,
        st * 0.72 + 16.8,
        ringIndex * 0.012 + 4.4,
      );
      const macroSigned = (macroNoise - 0.5) * 2;
      const ridgeLift = 1 - Math.abs(ridgeNoise * 2 - 1);
      const filamentLift = 1 - Math.abs(filamentNoise * 2 - 1);
      const sectorLift = Math.pow(clamp(sectorNoise, 0, 1), 2.4);
      const angularFold =
        Math.sin(angle * 4 + sectorLift * 6.2) * 0.5 +
        Math.sin(angle * 7 - 0.6) * 0.25;
      const signedRelief =
        macroSigned * currentForce * (0.42 + outerMountainMix * 0.3);
      const ridgeRelief =
        ridgeLift *
        currentForce *
        (0.14 + outerMountainMix * 1.35) *
        (0.42 + sectorLift * 1.85);
      const filamentRelief =
        filamentLift *
        currentForce *
        (0.04 + outerMountainMix * 0.52) *
        (0.3 + sectorLift * 0.9);
      const foldRelief =
        angularFold *
        currentForce *
        outerMountainMix *
        (0.16 + sectorLift * 0.42);
      const currentAperture =
        ringRadius +
        signedRelief +
        ridgeRelief +
        filamentRelief +
        foldRelief;

      xPoints[stepIndex] = centerX + currentAperture * ct;
      yPoints[stepIndex] = centerY + currentAperture * st;
    }

    context.beginPath();
    context.moveTo(xPoints[0] + shadowOffset * 0.45, yPoints[0] + shadowOffset);
    for (let stepIndex = 1; stepIndex <= radialSteps; stepIndex += 1) {
      context.lineTo(
        xPoints[stepIndex] + shadowOffset * 0.45,
        yPoints[stepIndex] + shadowOffset,
      );
    }
    context.strokeStyle = toRgba({ r: 4, g: 0, b: 8 }, alpha * 0.8);
    context.lineWidth = lineWidth * (1.9 + outerMountainMix * 0.45);
    context.stroke();

    context.strokeStyle = toRgba(color, alpha);
    context.lineWidth = lineWidth;
    context.beginPath();
    context.moveTo(xPoints[0], yPoints[0]);
    for (let stepIndex = 1; stepIndex <= radialSteps; stepIndex += 1) {
      context.lineTo(xPoints[stepIndex], yPoints[stepIndex]);
    }

    context.stroke();
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

    if (!ENABLE_INTRO_EXPANSION) {
      introStateRef.current = 'complete';
      setIntroState('complete');
      setShowEnterButton(false);
      revealPageContent();
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

    const drawFrame = (timeSeconds: number) => {
      renderPerlinField(
        context,
        viewportWidth,
        viewportHeight,
        timeSeconds,
      );
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
        drawFrame(0);
      });
    };

    const animate = (nowMs: number) => {
      const dprObservation = dprController.observeFrame(nowMs);
      if (dprObservation?.nextDpr) {
        resizeCanvas();
      }

      drawFrame(nowMs * 0.001);
      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    resizeCanvas();
    drawFrame(0);

    if (ENABLE_BACKGROUND_MOTION) {
      animationFrameRef.current = window.requestAnimationFrame(animate);
    }

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
      <div
        ref={rootRef}
        className={styles.root}
        data-intro-state={introState}
        data-portal-pulse={ENABLE_PORTAL_GLOW_PULSE ? 'true' : 'false'}
      >
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
