import type p5 from 'p5';
import {
  getPortraitOrientationMediaQuery,
  getReducedMotionMediaQuery,
  shouldApplyReducedMotion,
} from '@/lib/reduced-motion';
import {
  createParallaxTween,
  retargetParallaxTween,
  sampleParallaxTween,
  snapParallaxTween,
} from '../parallaxEasing';
import { resolveAdaptiveP5FrameRate } from '../p5AdaptiveFrameRate';

export type KusamaParams = {
  cellSize: number;
  jitter: number;
  rippleRadius: number;
  rippleStrength: number;
  lineThickness: number;
  opacity: number;
  driftAmount: number;
  driftSpeed: number;
  edgeCurvature: number;
};

export const KUSAMA_DEFAULT_PARAMS: KusamaParams = {
  // Base grid spacing in px. Suggested range: 26-120 (effective minimum is 26).
  cellSize: 140,
  // Random seed offset factor per cell. Range: 0-0.62 (0 = rigid grid; values above 0.62 are clamped).
  jitter: 1,
  // Pointer interaction radius in px. Suggested range: 24-600 (effective minimum is 24).
  rippleRadius: 250,
  // Pointer repulsion force applied within rippleRadius. Suggested range: 0-120.
  rippleStrength: 120,
  // Multiplier applied on top of CSS --be-kusama-line-width. Suggested range: 0.25-3.
  lineThickness: 1,
  // Global line opacity. Range: 0-1 (clamped).
  opacity: 1,
  // Amount of idle point drift in px. Suggested range: 0-8.
  driftAmount: 2.4,
  // Time scale for drift motion (higher = faster movement). Suggested range: 0-0.002.
  driftSpeed: 0.0002,
  // Curvature intensity for edges. Range: 0-1.5 (clamped, 0 = straight lines).
  edgeCurvature: 0.18,
};
const MOBILE_KUSAMA_CELL_SIZE = 22;
const KUSAMA_MOBILE_BREAKPOINT_PX = 770;
const KUSAMA_MOBILE_VIEWPORT_DELTA_IGNORE_PX = 200;
const KUSAMA_PARALLAX_REFERENCE_WIDTH_PX = 1440;
const KUSAMA_PARALLAX_MIN_SCALE = 0.7;
const KUSAMA_PARALLAX_MAX_SCALE = 1.35;
const KUSAMA_PARALLAX_TUNING = {
  maxTranslateX: 32,
  maxTranslateY: 15,
  maxRotateRadians: 0,
  baseScale: 1,
};
const KUSAMA_SCENE_DENSITY = 1.1;
const KUSAMA_INTRO_DURATION_MS = 3500;

type KusamaSketchOptions = {
  host: HTMLDivElement;
  canvasClassName?: string;
  params?: Partial<KusamaParams>;
  introDurationMs?: number;
};

type KusamaSeed = {
  anchorX: number;
  anchorY: number;
  phaseX: number;
  phaseY: number;
  freqX: number;
  freqY: number;
  ampScale: number;
  waveBias: number;
  bloomOriginX: number;
  bloomOriginY: number;
  introScatter: number;
  bloomDelay: number;
};

type KusamaSeedGrid = {
  seeds: KusamaSeed[];
  columnCount: number;
  rowCount: number;
};

type ResolvedStyles = {
  backgroundColor: string;
  lineColor: string;
  lineWidth: number;
  opacity: number;
};

type PointerState = {
  active: boolean;
  x: number;
  y: number;
  intensity: number;
  velocity: number;
};

type ParallaxState = {
  tweenX: ReturnType<typeof createParallaxTween>;
  tweenY: ReturnType<typeof createParallaxTween>;
};

type Edge = {
  ax: number;
  ay: number;
  bx: number;
  by: number;
};

type KusamaAnimatedMesh = {
  points: [number, number][];
  reveals: number[];
};

type KusamaIntroFrame = {
  progress: number;
  driftMix: number;
  pointerMix: number;
  lineWidthScale: number;
  opacity: number;
  edgeCurvatureScale: number;
  edgeRevealThreshold: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getCellSizeForDensity(baseCellSize: number, densityMultiplier: number) {
  return baseCellSize / Math.sqrt(Math.max(0.0001, densityMultiplier));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function fract(value: number): number {
  return value - Math.floor(value);
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function inverseLerp(start: number, end: number, value: number): number {
  if (start === end) {
    return value >= end ? 1 : 0;
  }

  return clamp01((value - start) / (end - start));
}

function easeOutCubic(value: number): number {
  const t = clamp01(value);
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(value: number): number {
  const t = clamp01(value);
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutExpo(value: number): number {
  const t = clamp01(value);
  if (t >= 1) {
    return 1;
  }

  return 1 - Math.pow(2, -10 * t);
}

function easeOutBack(value: number): number {
  const t = clamp01(value);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function hash2D(x: number, y: number): number {
  return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123);
}

function smoothNoise2D(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);

  const n00 = hash2D(ix, iy);
  const n10 = hash2D(ix + 1, iy);
  const n01 = hash2D(ix, iy + 1);
  const n11 = hash2D(ix + 1, iy + 1);

  const nx0 = lerp(n00, n10, sx);
  const nx1 = lerp(n01, n11, sx);
  return lerp(nx0, nx1, sy);
}

function getKusamaParallaxScale(viewportWidth: number): number {
  return clamp(
    viewportWidth / KUSAMA_PARALLAX_REFERENCE_WIDTH_PX,
    KUSAMA_PARALLAX_MIN_SCALE,
    KUSAMA_PARALLAX_MAX_SCALE,
  );
}

function createSeeds(
  width: number,
  height: number,
  params: KusamaParams,
): KusamaSeedGrid {
  const spacing = Math.max(26, params.cellSize);
  const columnCount = Math.ceil(width / spacing) + 4;
  const rowCount = Math.ceil(height / spacing) + 4;
  const seeds: KusamaSeed[] = [];
  const jitterDistance = spacing * clamp(params.jitter, 0, 0.62);
  const flowScale = 1 / Math.max(96, spacing * 2.8);
  const flowOffsetX = Math.random() * 1000;
  const flowOffsetY = Math.random() * 1000;
  const flowOffsetX2 = Math.random() * 1000;
  const flowOffsetY2 = Math.random() * 1000;
  const flowStrength = spacing * 0.26;
  const twistScale = flowScale * 2.1;
  const microScale = flowScale * 5.6;
  const twistOffsetX = Math.random() * 1000;
  const twistOffsetY = Math.random() * 1000;
  const twistOffsetX2 = Math.random() * 1000;
  const twistOffsetY2 = Math.random() * 1000;
  const microOffsetX = Math.random() * 1000;
  const microOffsetY = Math.random() * 1000;
  const microOffsetX2 = Math.random() * 1000;
  const microOffsetY2 = Math.random() * 1000;
  const twistStrength = spacing * 0.34;
  const microTwistStrength = spacing * 0.16;
  const introScale = 1 / Math.max(180, spacing * 5.2);
  const introOffsetX = Math.random() * 1000;
  const introOffsetY = Math.random() * 1000;
  const introOffsetX2 = Math.random() * 1000;
  const introOffsetY2 = Math.random() * 1000;
  const coarseSpacing = spacing * 3.2;

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row = rowIndex - 1;
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const column = columnIndex - 1;
      let x = column * spacing + spacing * 0.5;
      let y = row * spacing + spacing * 0.5;

      const flowA = smoothNoise2D(
        (x + flowOffsetX) * flowScale,
        (y + flowOffsetY) * flowScale,
      );
      const flowB = smoothNoise2D(
        (x + flowOffsetX2) * flowScale,
        (y + flowOffsetY2) * flowScale,
      );
      const flowAngle = flowA * Math.PI * 4 + flowB * Math.PI * 2;
      const flowMagnitude = flowStrength * (0.45 + flowB * 0.8);

      x += Math.cos(flowAngle) * flowMagnitude;
      y += Math.sin(flowAngle) * flowMagnitude;

      const twistX =
        (smoothNoise2D(
          (x + twistOffsetX) * twistScale,
          (y + twistOffsetY) * twistScale,
        ) -
          0.5) *
        2 *
        twistStrength;
      const twistY =
        (smoothNoise2D(
          (x + twistOffsetX2) * twistScale,
          (y + twistOffsetY2) * twistScale,
        ) -
          0.5) *
        2 *
        twistStrength;
      const microAngle =
        smoothNoise2D(
          (x + microOffsetX) * microScale,
          (y + microOffsetY) * microScale,
        ) *
        Math.PI *
        4;
      const microMagnitude =
        microTwistStrength *
        (0.35 +
          smoothNoise2D(
            (x + microOffsetX2) * microScale,
            (y + microOffsetY2) * microScale,
          ) *
            0.9);
      const axisBias = (flowB - 0.5) * spacing * 0.22;

      x += twistX + Math.cos(microAngle) * microMagnitude + axisBias;
      y += twistY + Math.sin(microAngle) * microMagnitude - axisBias * 0.85;

      const jitterAngle = Math.random() * Math.PI * 2;
      const jitterScale = Math.random() * jitterDistance;
      const anchorX = x + Math.cos(jitterAngle) * jitterScale;
      const anchorY = y + Math.sin(jitterAngle) * jitterScale;
      const introNoise = smoothNoise2D(
        (anchorX + introOffsetX) * introScale,
        (anchorY + introOffsetY) * introScale,
      );
      const waveBias = smoothNoise2D(
        (anchorX + introOffsetX2) * introScale * 1.7,
        (anchorY + introOffsetY2) * introScale * 1.7,
      );
      const coarseX =
        Math.floor(anchorX / coarseSpacing) * coarseSpacing +
        coarseSpacing * 0.5;
      const coarseY =
        Math.floor(anchorY / coarseSpacing) * coarseSpacing +
        coarseSpacing * 0.5;
      const bloomOriginMix = 0.42 + introNoise * 0.26;
      const bloomOriginX = lerp(coarseX, width * 0.5, bloomOriginMix);
      const bloomOriginY = lerp(coarseY, height * 0.5, bloomOriginMix);
      const introScatter = spacing * (0.35 + waveBias * 0.8);
      const bloomDelay = clamp01(introNoise * 0.76 + waveBias * 0.16);

      seeds.push({
        anchorX,
        anchorY,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        freqX: 0.8 + Math.random() * 0.6,
        freqY: 0.8 + Math.random() * 0.6,
        ampScale: 0.7 + Math.random() * 0.6,
        waveBias,
        bloomOriginX,
        bloomOriginY,
        introScatter,
        bloomDelay,
      });
    }
  }

  return {
    seeds,
    columnCount,
    rowCount,
  };
}

function resolveStyles(
  host: HTMLElement,
  params: KusamaParams,
): ResolvedStyles {
  const computedStyles = getComputedStyle(host);
  const backgroundColor =
    computedStyles.getPropertyValue('--be-kusama-bg-color').trim() || '#f4eee2';
  const lineColor =
    computedStyles.getPropertyValue('--be-kusama-line-color').trim() ||
    '#ba3a52';
  const rawWidth = computedStyles
    .getPropertyValue('--be-kusama-line-width')
    .trim();
  const parsedWidth = Number.parseFloat(rawWidth);
  const cssWidth =
    Number.isFinite(parsedWidth) && parsedWidth > 0 ? parsedWidth : 1;
  const thicknessScale =
    Number.isFinite(params.lineThickness) && params.lineThickness > 0
      ? params.lineThickness
      : 1;

  return {
    backgroundColor,
    lineColor,
    lineWidth: Math.max(0.25, cssWidth * thicknessScale),
    opacity: clamp01(params.opacity),
  };
}

function buildAnimatedPoints(
  seeds: KusamaSeed[],
  params: KusamaParams,
  pointer: PointerState,
  introFrame: KusamaIntroFrame | null,
  timeMs: number,
  width: number,
  height: number,
): KusamaAnimatedMesh {
  const points: [number, number][] = [];
  const reveals: number[] = [];
  const radius = Math.max(24, params.rippleRadius);
  const radiusSq = radius * radius;
  const driftAmount =
    Math.max(0, params.driftAmount) * (introFrame?.driftMix ?? 1);
  const driftTime = timeMs * Math.max(0, params.driftSpeed);

  for (const seed of seeds) {
    const driftScale = driftAmount * seed.ampScale;
    let x =
      seed.anchorX +
      Math.sin(driftTime * seed.freqX + seed.phaseX) * driftScale +
      Math.cos(driftTime * seed.freqY + seed.phaseY) * driftScale * 0.25;
    let y =
      seed.anchorY +
      Math.cos(driftTime * seed.freqY + seed.phaseY) * driftScale +
      Math.sin(driftTime * seed.freqX + seed.phaseX) * driftScale * 0.25;

    if (pointer.intensity > 0) {
      const dx = x - pointer.x;
      const dy = y - pointer.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < radiusSq) {
        const dist = Math.max(0.0001, Math.sqrt(distSq));
        const ndx = dx / dist;
        const ndy = dy / dist;
        const influence = 1 - dist / radius;
        const falloff = influence * influence;
        const velocityBoost = 1 + pointer.velocity * 0.4;
        const push =
          params.rippleStrength * pointer.intensity * falloff * velocityBoost;

        // Repel interaction.
        x += ndx * push;
        y += ndy * push;
      }
    }

    let reveal = 1;
    if (introFrame && introFrame.progress < 1) {
      const localStart = seed.bloomDelay * 0.58;
      const localDuration = 0.26 + seed.waveBias * 0.18;
      const localProgress = inverseLerp(
        localStart,
        localStart + localDuration,
        introFrame.progress,
      );
      const eased = easeOutBack(localProgress);
      const settle = 1 - easeOutCubic(localProgress);
      const wobble = seed.introScatter * 0.18 * settle;
      const originX =
        seed.bloomOriginX +
        Math.cos(seed.phaseX * 1.2 + introFrame.progress * 11) * wobble;
      const originY =
        seed.bloomOriginY +
        Math.sin(seed.phaseY * 1.2 + introFrame.progress * 9) * wobble;

      x = lerp(originX, x, eased);
      y = lerp(originY, y, eased);
      reveal = easeInOutCubic(localProgress);
    }

    points.push([clamp(x, -18, width + 18), clamp(y, -18, height + 18)]);
    reveals.push(clamp01(reveal));
  }

  return {
    points,
    reveals,
  };
}

function getQuadMeshEdges(
  points: [number, number][],
  reveals: number[],
  columnCount: number,
  rowCount: number,
  width: number,
  height: number,
  minimumReveal = 0,
): Edge[] {
  if (columnCount < 2 || rowCount < 2 || points.length < columnCount * rowCount) {
    return [];
  }

  const edges: Edge[] = [];
  const viewportMargin = 24;

  const isVisible = (ax: number, ay: number, bx: number, by: number) => {
    const beyondLeft = ax < -viewportMargin && bx < -viewportMargin;
    const beyondRight = ax > width + viewportMargin && bx > width + viewportMargin;
    const beyondTop = ay < -viewportMargin && by < -viewportMargin;
    const beyondBottom = ay > height + viewportMargin && by > height + viewportMargin;
    return !(beyondLeft || beyondRight || beyondTop || beyondBottom);
  };

  for (let row = 0; row < rowCount; row += 1) {
    for (let column = 0; column < columnCount; column += 1) {
      const index = row * columnCount + column;
      const [ax, ay] = points[index];

      if (column < columnCount - 1) {
        const [bx, by] = points[index + 1];
        if (
          reveals[index] >= minimumReveal &&
          reveals[index + 1] >= minimumReveal &&
          isVisible(ax, ay, bx, by) &&
          Math.hypot(bx - ax, by - ay) >= 1
        ) {
          edges.push({ ax, ay, bx, by });
        }
      }

      if (row < rowCount - 1) {
        const [bx, by] = points[index + columnCount];
        if (
          reveals[index] >= minimumReveal &&
          reveals[index + columnCount] >= minimumReveal &&
          isVisible(ax, ay, bx, by) &&
          Math.hypot(bx - ax, by - ay) >= 1
        ) {
          edges.push({ ax, ay, bx, by });
        }
      }
    }
  }

  return edges;
}

function renderOrganicEdges(
  context: CanvasRenderingContext2D,
  edges: Edge[],
  styles: ResolvedStyles,
  params: KusamaParams,
) {
  context.save();
  context.globalAlpha = styles.opacity;
  context.beginPath();
  const curvature = clamp(params.edgeCurvature, 0, 1.5);
  const shouldRenderStraight = curvature < 0.045;

  for (const edge of edges) {
    const dx = edge.bx - edge.ax;
    const dy = edge.by - edge.ay;
    const length = Math.hypot(dx, dy);
    if (length < 1) {
      continue;
    }

    const nx = -dy / length;
    const ny = dx / length;
    const wave = Math.sin(
      edge.ax * 0.031 +
        edge.ay * 0.017 +
        edge.bx * 0.027 +
        edge.by * 0.021,
    );
    const maxOffset = Math.min(length * 0.14, 5.5) * curvature;
    const offset = wave * maxOffset;
    const controlX = (edge.ax + edge.bx) * 0.5 + nx * offset;
    const controlY = (edge.ay + edge.by) * 0.5 + ny * offset;

    context.moveTo(edge.ax, edge.ay);
    if (shouldRenderStraight) {
      context.lineTo(edge.bx, edge.by);
    } else {
      context.quadraticCurveTo(controlX, controlY, edge.bx, edge.by);
    }
  }

  context.lineWidth = styles.lineWidth;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = styles.lineColor;
  context.stroke();
  context.restore();
}

function resolveKusamaIntroFrame(progress: number): KusamaIntroFrame | null {
  const clampedProgress = clamp01(progress);
  if (clampedProgress >= 1) {
    return null;
  }

  const easedProgress = easeOutCubic(clampedProgress);
  return {
    progress: clampedProgress,
    driftMix: 0.18 + easedProgress * 0.82,
    pointerMix: inverseLerp(0.68, 1, clampedProgress),
    lineWidthScale: lerp(1.38, 1, easedProgress),
    opacity: easeInOutCubic(inverseLerp(0.04, 0.42, clampedProgress)),
    edgeCurvatureScale: 0.24 + easedProgress * 0.76,
    edgeRevealThreshold: 0.16,
  };
}

export function createKusamaSketch(options: KusamaSketchOptions) {
  const settings: KusamaParams = {
    ...KUSAMA_DEFAULT_PARAMS,
    ...options.params,
  };
  const introDurationMs = Math.max(
    1,
    options.introDurationMs ?? KUSAMA_INTRO_DURATION_MS,
  );

  return (instance: p5) => {
    let seeds: KusamaSeed[] = [];
    let seedColumnCount = 0;
    let seedRowCount = 0;
    let styles = resolveStyles(options.host, settings);
    let lastViewportWidth = 0;
    let lastViewportHeight = 0;
    let lastOrientation: 'portrait' | 'landscape' = 'landscape';
    const pointer: PointerState = {
      active: false,
      x: 0,
      y: 0,
      intensity: 0,
      velocity: 0,
    };
    const parallax: ParallaxState = {
      tweenX: createParallaxTween(0),
      tweenY: createParallaxTween(0),
    };
    const teardownFns: Array<() => void> = [];
    let parallaxEnabled = false;
    let reducedMotionEnabled = false;
    let activeFrameRate = 0;
    let introStartMs = 0;

    const isNarrowViewport = () => window.innerWidth < KUSAMA_MOBILE_BREAKPOINT_PX;
    const getOrientation = (width: number, height: number) =>
      width >= height ? 'landscape' : 'portrait';
    const isCoarsePointerDevice = () =>
      window.matchMedia('(pointer: coarse)').matches ||
      (navigator.maxTouchPoints ?? 0) > 0;
    const prefersReducedMotion = () => shouldApplyReducedMotion();
    const supportsParallaxInput = () =>
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const setParallaxTargetFromClient = (clientX: number, clientY: number) => {
      if (!parallaxEnabled) return;

      const viewportWidth = Math.max(1, window.innerWidth);
      const viewportHeight = Math.max(1, window.innerHeight);
      // Matches Shopify's `x / width - 0.5` coordinate space.
      const normalizedX = clientX / viewportWidth - 0.5;
      const normalizedY = clientY / viewportHeight - 0.5;

      const nextX = clamp(normalizedX, -1, 1);
      const nextY = clamp(normalizedY, -1, 1);
      const nowMs = performance.now();

      retargetParallaxTween(parallax.tweenX, nextX, nowMs);
      retargetParallaxTween(parallax.tweenY, nextY, nowMs);
    };

    const resetParallaxTargets = (immediate = false) => {
      const nowMs = performance.now();

      if (immediate) {
        snapParallaxTween(parallax.tweenX, 0);
        snapParallaxTween(parallax.tweenY, 0);
        return;
      }

      retargetParallaxTween(parallax.tweenX, 0, nowMs);
      retargetParallaxTween(parallax.tweenY, 0, nowMs);
    };

    const setupSeeds = (densityMultiplier = 1) => {
      const resolvedSettings = isNarrowViewport()
        ? { ...settings, cellSize: MOBILE_KUSAMA_CELL_SIZE }
        : settings;
      const resolvedCellSize = getCellSizeForDensity(
        resolvedSettings.cellSize,
        densityMultiplier,
      );
      const seedGrid = createSeeds(instance.width, instance.height, {
        ...resolvedSettings,
        cellSize: resolvedCellSize,
      });
      seeds = seedGrid.seeds;
      seedColumnCount = seedGrid.columnCount;
      seedRowCount = seedGrid.rowCount;
    };

    const updateAdaptiveFrameRate = (
      viewportWidth: number,
      viewportHeight: number,
    ) => {
      const nextFrameRate = resolveAdaptiveP5FrameRate({
        viewportWidth,
        viewportHeight,
        coarsePointer: isCoarsePointerDevice(),
      });
      if (nextFrameRate === activeFrameRate) return;
      activeFrameRate = nextFrameRate;
      instance.frameRate(activeFrameRate);
    };

    const updatePointer = (x: number, y: number, boost: number) => {
      const dx = x - pointer.x;
      const dy = y - pointer.y;
      pointer.velocity = clamp(Math.hypot(dx, dy) / 28, 0, 3);
      pointer.active = true;
      pointer.x = x;
      pointer.y = y;
      pointer.intensity = Math.max(pointer.intensity, clamp01(boost));
    };
    const clearPointer = () => {
      pointer.active = false;
      pointer.intensity = 0;
      pointer.velocity = 0;
    };

    const syncMotionPreference = (isReducedMotion: boolean) => {
      reducedMotionEnabled = isReducedMotion;
      parallaxEnabled = !reducedMotionEnabled && supportsParallaxInput();
      if (!parallaxEnabled) {
        resetParallaxTargets(true);
      }
      if (reducedMotionEnabled) {
        clearPointer();
      }
    };

    const fadePointer = () => {
      pointer.intensity *= 0.93;
      pointer.velocity *= 0.85;
      if (pointer.intensity < 0.01) {
        pointer.intensity = 0;
        pointer.velocity = 0;
        pointer.active = false;
      }
    };

    instance.setup = () => {
      const canvas = instance.createCanvas(
        instance.windowWidth,
        instance.windowHeight,
      );
      canvas.parent(options.host);
      if (options.canvasClassName) {
        canvas.elt.className = options.canvasClassName;
      }

      instance.pixelDensity(1);
      updateAdaptiveFrameRate(instance.windowWidth, instance.windowHeight);
      setupSeeds(KUSAMA_SCENE_DENSITY);
      introStartMs = performance.now();
      lastViewportWidth = instance.windowWidth;
      lastViewportHeight = instance.windowHeight;
      lastOrientation = getOrientation(lastViewportWidth, lastViewportHeight);
      syncMotionPreference(prefersReducedMotion());

      const onPointerMove = (event: PointerEvent) => {
        if (reducedMotionEnabled || !parallaxEnabled) return;
        if (event.pointerType && event.pointerType !== 'mouse') return;
        updatePointer(event.clientX, event.clientY, 0.72);
        setParallaxTargetFromClient(event.clientX, event.clientY);
      };
      const onPointerDown = (event: PointerEvent) => {
        if (reducedMotionEnabled || !parallaxEnabled) return;
        if (event.pointerType && event.pointerType !== 'mouse') return;
        updatePointer(event.clientX, event.clientY, 1);
        setParallaxTargetFromClient(event.clientX, event.clientY);
      };
      const onPointerLeave = () => {
        clearPointer();
        resetParallaxTargets();
      };
      const onBlur = () => {
        clearPointer();
        resetParallaxTargets();
      };
      const reducedMotionQuery = window.matchMedia(getReducedMotionMediaQuery());
      const orientationQuery = window.matchMedia(
        getPortraitOrientationMediaQuery(),
      );
      const onReducedMotionChange = () => {
        syncMotionPreference(prefersReducedMotion());
      };

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerdown', onPointerDown, { passive: true });
      window.addEventListener('pointerleave', onPointerLeave, {
        passive: true,
      });
      window.addEventListener('blur', onBlur);
      if (typeof reducedMotionQuery.addEventListener === 'function') {
        reducedMotionQuery.addEventListener('change', onReducedMotionChange);
      } else {
        reducedMotionQuery.addListener(onReducedMotionChange);
      }
      if (typeof orientationQuery.addEventListener === 'function') {
        orientationQuery.addEventListener('change', onReducedMotionChange);
      } else {
        orientationQuery.addListener(onReducedMotionChange);
      }
      const handleVisibilityChange = () => {
        if (document.hidden) {
          instance.noLoop();
        } else {
          instance.loop();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      teardownFns.push(() => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointerleave', onPointerLeave);
        window.removeEventListener('blur', onBlur);
        if (typeof reducedMotionQuery.removeEventListener === 'function') {
          reducedMotionQuery.removeEventListener('change', onReducedMotionChange);
        } else {
          reducedMotionQuery.removeListener(onReducedMotionChange);
        }
        if (typeof orientationQuery.removeEventListener === 'function') {
          orientationQuery.removeEventListener('change', onReducedMotionChange);
        } else {
          orientationQuery.removeListener(onReducedMotionChange);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      });

      if (document.hidden) {
        instance.noLoop();
      }

      const originalRemove = instance.remove.bind(instance);
      instance.remove = (() => {
        for (const teardown of teardownFns) {
          teardown();
        }
        teardownFns.length = 0;
        originalRemove();
      }) as typeof instance.remove;
    };

    instance.draw = () => {
      styles = resolveStyles(options.host, settings);
      instance.background(styles.backgroundColor);

      const nowMs = performance.now();
      const introFrame = resolveKusamaIntroFrame(
        (nowMs - introStartMs) / introDurationMs,
      );
      const pointerX = parallaxEnabled
        ? sampleParallaxTween(parallax.tweenX, nowMs)
        : 0;
      const pointerY = parallaxEnabled
        ? sampleParallaxTween(parallax.tweenY, nowMs)
        : 0;
      const viewportScale = getKusamaParallaxScale(instance.width);
      const meshTranslateX =
        pointerX * KUSAMA_PARALLAX_TUNING.maxTranslateX * viewportScale;
      const meshTranslateY =
        -pointerY * KUSAMA_PARALLAX_TUNING.maxTranslateY * viewportScale;
      const meshRotate =
        pointerX * KUSAMA_PARALLAX_TUNING.maxRotateRadians * viewportScale;
      const meshScale = KUSAMA_PARALLAX_TUNING.baseScale;
      const ripplePointer: PointerState = {
        ...pointer,
        intensity: pointer.intensity * (introFrame?.pointerMix ?? 1),
        // Keep pointer-centered ripple aligned after parallax translation.
        x: pointer.x - meshTranslateX,
        y: pointer.y - meshTranslateY,
      };

      const animatedMesh = buildAnimatedPoints(
        seeds,
        settings,
        ripplePointer,
        introFrame,
        nowMs,
        instance.width,
        instance.height,
      );
      const renderStyles: ResolvedStyles = {
        ...styles,
        lineWidth: styles.lineWidth * (introFrame?.lineWidthScale ?? 1),
        opacity: styles.opacity * (introFrame?.opacity ?? 1),
      };
      const renderParams: KusamaParams = {
        ...settings,
        edgeCurvature:
          settings.edgeCurvature * (introFrame?.edgeCurvatureScale ?? 1),
      };

      if (animatedMesh.points.length >= 3) {
        const edges = getQuadMeshEdges(
          animatedMesh.points,
          animatedMesh.reveals,
          seedColumnCount,
          seedRowCount,
          instance.width,
          instance.height,
          introFrame?.edgeRevealThreshold ?? 0,
        );
        const context = instance.drawingContext as CanvasRenderingContext2D;
        context.save();
        context.translate(
          instance.width * 0.5 + meshTranslateX,
          instance.height * 0.5 + meshTranslateY,
        );
        context.rotate(meshRotate);
        context.scale(meshScale, meshScale);
        context.translate(-instance.width * 0.5, -instance.height * 0.5);
        renderOrganicEdges(context, edges, renderStyles, renderParams);
        context.restore();
      }

      if (pointer.active) {
        fadePointer();
      }
    };

    instance.windowResized = () => {
      const nextWidth = instance.windowWidth;
      const nextHeight = instance.windowHeight;
      const nextOrientation = getOrientation(nextWidth, nextHeight);
      const widthDelta = Math.abs(nextWidth - lastViewportWidth);
      const heightDelta = Math.abs(nextHeight - lastViewportHeight);
      const viewportDelta = Math.max(widthDelta, heightDelta);
      const orientationChanged = nextOrientation !== lastOrientation;
      const isLikelyMobileViewportChurn =
        isCoarsePointerDevice() &&
        !orientationChanged &&
        viewportDelta < KUSAMA_MOBILE_VIEWPORT_DELTA_IGNORE_PX;

      if (isLikelyMobileViewportChurn) {
        return;
      }

      syncMotionPreference(prefersReducedMotion());

      instance.resizeCanvas(nextWidth, nextHeight);
      updateAdaptiveFrameRate(nextWidth, nextHeight);
      setupSeeds(KUSAMA_SCENE_DENSITY);
      lastViewportWidth = nextWidth;
      lastViewportHeight = nextHeight;
      lastOrientation = nextOrientation;
    };
  };
}
