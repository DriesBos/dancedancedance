import type p5 from 'p5';
import {
  createParallaxTween,
  retargetParallaxTween,
  sampleParallaxTween,
  snapParallaxTween,
} from './parallaxEasing';

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
  cellSize: 48,
  jitter: 0.4,
  rippleRadius: 250,
  rippleStrength: 44,
  lineThickness: 1,
  opacity: 0.9,
  driftAmount: 2.4,
  driftSpeed: 0.00022,
  edgeCurvature: 0.18,
};
const MOBILE_KUSAMA_CELL_SIZE = 25;
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
const KUSAMA_GENERATION_DURATION_MS = 3000;
const KUSAMA_GENERATION_START_DENSITY = 1;
const KUSAMA_GENERATION_END_DENSITY = 1.08;
const KUSAMA_GENERATION_ADDITION_COUNT = 6;
const KUSAMA_GENERATION_ADDITION_RADIUS_MULTIPLIER = 1.28;

type KusamaSketchOptions = {
  host: HTMLDivElement;
  canvasClassName?: string;
  params?: Partial<KusamaParams>;
};

type KusamaSeed = {
  anchorX: number;
  anchorY: number;
  phaseX: number;
  phaseY: number;
  freqX: number;
  freqY: number;
  ampScale: number;
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

type CellAdditionEvent = {
  activateAtMs: number;
  x: number;
  y: number;
  radius: number;
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

function getEdgeRevealRank(
  row: number,
  column: number,
  orientation: 'horizontal' | 'vertical',
): number {
  const orientationOffset = orientation === 'horizontal' ? 0.17 : 0.63;
  const noise = smoothNoise2D(
    (column + orientationOffset) * 0.235,
    (row + orientationOffset) * 0.235,
  );
  const parityBias = ((row & 1) + (column & 1)) * 0.07;
  return clamp01(noise * 0.86 + parityBias);
}

function pickCoordinateWithin(size: number, margin: number): number {
  const min = margin;
  const max = size - margin;
  if (max <= min) {
    return size * 0.5;
  }
  return min + Math.random() * (max - min);
}

function createCellAdditionEvents(
  width: number,
  height: number,
  startAtMs: number,
  cellSize: number,
): CellAdditionEvent[] {
  const events: CellAdditionEvent[] = [];
  const count = KUSAMA_GENERATION_ADDITION_COUNT;
  const margin = Math.max(24, cellSize * 1.6);
  const minDistance = cellSize * 2.25;

  for (let index = 0; index < count; index += 1) {
    const progress =
      (index + 1) / (count + 1) + (Math.random() * 2 - 1) * 0.08;
    const clampedProgress = clamp01(progress);

    let x = width * 0.5;
    let y = height * 0.5;
    let attempts = 0;
    do {
      x = pickCoordinateWithin(width, margin);
      y = pickCoordinateWithin(height, margin);
      attempts += 1;
    } while (
      attempts < 28 &&
      events.some((event) => Math.hypot(event.x - x, event.y - y) < minDistance)
    );

    events.push({
      activateAtMs: startAtMs + clampedProgress * KUSAMA_GENERATION_DURATION_MS,
      x,
      y,
      radius:
        cellSize *
        KUSAMA_GENERATION_ADDITION_RADIUS_MULTIPLIER *
        (0.86 + Math.random() * 0.28),
    });
  }

  events.sort((a, b) => a.activateAtMs - b.activateAtMs);
  return events;
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

      seeds.push({
        anchorX: x + Math.cos(jitterAngle) * jitterScale,
        anchorY: y + Math.sin(jitterAngle) * jitterScale,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        freqX: 0.8 + Math.random() * 0.6,
        freqY: 0.8 + Math.random() * 0.6,
        ampScale: 0.7 + Math.random() * 0.6,
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
  timeMs: number,
  width: number,
  height: number,
): [number, number][] {
  const points: [number, number][] = [];
  const radius = Math.max(24, params.rippleRadius);
  const radiusSq = radius * radius;
  const driftAmount = Math.max(0, params.driftAmount);
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

    points.push([clamp(x, -18, width + 18), clamp(y, -18, height + 18)]);
  }

  return points;
}

function getQuadMeshEdges(
  points: [number, number][],
  columnCount: number,
  rowCount: number,
  width: number,
  height: number,
  baseRevealFraction: number,
  additions: CellAdditionEvent[],
): Edge[] {
  if (columnCount < 2 || rowCount < 2 || points.length < columnCount * rowCount) {
    return [];
  }

  const edges: Edge[] = [];
  const viewportMargin = 24;
  const revealThreshold = clamp01(baseRevealFraction);

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
        const midpointX = (ax + bx) * 0.5;
        const midpointY = (ay + by) * 0.5;
        const edgeVisibleByBase =
          getEdgeRevealRank(row, column, 'horizontal') <= revealThreshold;
        const edgeVisibleByAddition =
          !edgeVisibleByBase &&
          additions.some((event) => {
            const dx = midpointX - event.x;
            const dy = midpointY - event.y;
            return dx * dx + dy * dy <= event.radius * event.radius;
          });
        if (
          isVisible(ax, ay, bx, by) &&
          Math.hypot(bx - ax, by - ay) >= 1 &&
          (edgeVisibleByBase || edgeVisibleByAddition)
        ) {
          edges.push({ ax, ay, bx, by });
        }
      }

      if (row < rowCount - 1) {
        const [bx, by] = points[index + columnCount];
        const midpointX = (ax + bx) * 0.5;
        const midpointY = (ay + by) * 0.5;
        const edgeVisibleByBase =
          getEdgeRevealRank(row, column, 'vertical') <= revealThreshold;
        const edgeVisibleByAddition =
          !edgeVisibleByBase &&
          additions.some((event) => {
            const dx = midpointX - event.x;
            const dy = midpointY - event.y;
            return dx * dx + dy * dy <= event.radius * event.radius;
          });
        if (
          isVisible(ax, ay, bx, by) &&
          Math.hypot(bx - ax, by - ay) >= 1 &&
          (edgeVisibleByBase || edgeVisibleByAddition)
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

export function createKusamaSketch(options: KusamaSketchOptions) {
  const settings: KusamaParams = {
    ...KUSAMA_DEFAULT_PARAMS,
    ...options.params,
  };

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
    let activationStartedAtMs = 0;
    let resolvedSceneCellSize = settings.cellSize;
    let cellAdditionEvents: CellAdditionEvent[] = [];

    const isNarrowViewport = () => window.innerWidth < KUSAMA_MOBILE_BREAKPOINT_PX;
    const getOrientation = (width: number, height: number) =>
      width >= height ? 'landscape' : 'portrait';
    const isCoarsePointerDevice = () =>
      window.matchMedia('(pointer: coarse)').matches ||
      (navigator.maxTouchPoints ?? 0) > 0;
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

    const getEdgeBaseRevealFraction = () =>
      clamp01(KUSAMA_GENERATION_START_DENSITY / KUSAMA_GENERATION_END_DENSITY);

    const getActiveAdditionEvents = (nowMs: number) =>
      cellAdditionEvents.filter((event) => nowMs >= event.activateAtMs);

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
      resolvedSceneCellSize = resolvedCellSize;
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
      instance.frameRate(30);
      activationStartedAtMs = performance.now();
      setupSeeds(KUSAMA_GENERATION_END_DENSITY);
      cellAdditionEvents = createCellAdditionEvents(
        instance.width,
        instance.height,
        activationStartedAtMs,
        resolvedSceneCellSize,
      );
      lastViewportWidth = instance.windowWidth;
      lastViewportHeight = instance.windowHeight;
      lastOrientation = getOrientation(lastViewportWidth, lastViewportHeight);
      parallaxEnabled = supportsParallaxInput();

      const onPointerMove = (event: PointerEvent) => {
        updatePointer(event.clientX, event.clientY, 0.72);
        setParallaxTargetFromClient(event.clientX, event.clientY);
      };
      const onPointerDown = (event: PointerEvent) => {
        updatePointer(event.clientX, event.clientY, 1);
        setParallaxTargetFromClient(event.clientX, event.clientY);
      };
      const onPointerLeave = () => {
        pointer.active = false;
        resetParallaxTargets();
      };
      const onBlur = () => {
        pointer.active = false;
        resetParallaxTargets();
      };

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerdown', onPointerDown, { passive: true });
      window.addEventListener('pointerleave', onPointerLeave, {
        passive: true,
      });
      window.addEventListener('blur', onBlur);
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
      const edgeBaseRevealFraction = getEdgeBaseRevealFraction();
      const activeAdditionEvents = getActiveAdditionEvents(nowMs);
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
        // Keep pointer-centered ripple aligned after parallax translation.
        x: pointer.x - meshTranslateX,
        y: pointer.y - meshTranslateY,
      };

      const points = buildAnimatedPoints(
        seeds,
        settings,
        ripplePointer,
        nowMs,
        instance.width,
        instance.height,
      );

      if (points.length >= 3) {
        const edges = getQuadMeshEdges(
          points,
          seedColumnCount,
          seedRowCount,
          instance.width,
          instance.height,
          edgeBaseRevealFraction,
          activeAdditionEvents,
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
        renderOrganicEdges(context, edges, styles, settings);
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

      parallaxEnabled = supportsParallaxInput();
      if (!parallaxEnabled) {
        resetParallaxTargets(true);
      }

      instance.resizeCanvas(nextWidth, nextHeight);
      setupSeeds(KUSAMA_GENERATION_END_DENSITY);
      cellAdditionEvents = createCellAdditionEvents(
        nextWidth,
        nextHeight,
        activationStartedAtMs,
        resolvedSceneCellSize,
      );
      lastViewportWidth = nextWidth;
      lastViewportHeight = nextHeight;
      lastOrientation = nextOrientation;
    };
  };
}
