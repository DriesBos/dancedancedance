import type p5 from 'p5';
import { Delaunay } from 'd3-delaunay';
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
};

export const KUSAMA_DEFAULT_PARAMS: KusamaParams = {
  cellSize: 50,
  jitter: 1,
  rippleRadius: 250,
  rippleStrength: 50,
  lineThickness: 1,
  opacity: 0.9,
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
  key: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function getKusamaParallaxScale(viewportWidth: number): number {
  return clamp(
    viewportWidth / KUSAMA_PARALLAX_REFERENCE_WIDTH_PX,
    KUSAMA_PARALLAX_MIN_SCALE,
    KUSAMA_PARALLAX_MAX_SCALE,
  );
}

function quantize(value: number, step = 0.5): number {
  return Math.round(value / step) * step;
}

function edgeKey(ax: number, ay: number, bx: number, by: number): string {
  const aX = quantize(ax);
  const aY = quantize(ay);
  const bX = quantize(bx);
  const bY = quantize(by);

  if (aX < bX || (aX === bX && aY <= bY)) {
    return `${aX},${aY}|${bX},${bY}`;
  }
  return `${bX},${bY}|${aX},${aY}`;
}

function createSeeds(
  width: number,
  height: number,
  params: KusamaParams,
): KusamaSeed[] {
  const spacing = Math.max(28, params.cellSize);
  const cols = Math.ceil(width / spacing) + 3;
  const rows = Math.ceil(height / spacing) + 3;
  const seeds: KusamaSeed[] = [];
  const jitterDistance = spacing * clamp(params.jitter, 0, 0.49);

  for (let row = -1; row < rows; row += 1) {
    for (let col = -1; col < cols; col += 1) {
      const x = col * spacing + spacing * 0.5;
      const y = row * spacing + spacing * 0.5;
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

  return seeds;
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
  width: number,
  height: number,
): [number, number][] {
  const points: [number, number][] = [];
  const radius = Math.max(24, params.rippleRadius);
  const radiusSq = radius * radius;

  for (const seed of seeds) {
    let x = seed.anchorX;
    let y = seed.anchorY;

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

    points.push([clamp(x, -12, width + 12), clamp(y, -12, height + 12)]);
  }

  return points;
}

function getVoronoiEdges(voronoi: any, width: number, height: number): Edge[] {
  const map = new Map<string, Edge>();
  const epsilon = 0.75;

  for (const polygon of voronoi.cellPolygons()) {
    const points = Array.from(polygon as Iterable<[number, number]>);
    if (points.length < 2) {
      continue;
    }

    for (let i = 0; i < points.length - 1; i += 1) {
      const [ax, ay] = points[i];
      const [bx, by] = points[i + 1];
      if (
        !Number.isFinite(ax) ||
        !Number.isFinite(ay) ||
        !Number.isFinite(bx) ||
        !Number.isFinite(by)
      ) {
        continue;
      }

      if (Math.hypot(bx - ax, by - ay) < 1) {
        continue;
      }

      const onLeft = Math.abs(ax) <= epsilon && Math.abs(bx) <= epsilon;
      const onRight =
        Math.abs(ax - width) <= epsilon && Math.abs(bx - width) <= epsilon;
      const onTop = Math.abs(ay) <= epsilon && Math.abs(by) <= epsilon;
      const onBottom =
        Math.abs(ay - height) <= epsilon && Math.abs(by - height) <= epsilon;
      if (onLeft || onRight || onTop || onBottom) {
        continue;
      }

      const key = edgeKey(ax, ay, bx, by);
      if (!map.has(key)) {
        map.set(key, { ax, ay, bx, by, key });
      }
    }
  }

  return [...map.values()];
}

function renderStraightEdges(
  context: CanvasRenderingContext2D,
  edges: Edge[],
  styles: ResolvedStyles,
) {
  context.save();
  context.globalAlpha = styles.opacity;
  context.beginPath();

  for (const edge of edges) {
    context.moveTo(edge.ax, edge.ay);
    context.lineTo(edge.bx, edge.by);
  }

  context.lineWidth = styles.lineWidth;
  context.lineCap = 'butt';
  context.lineJoin = 'miter';
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

    const setupSeeds = () => {
      const resolvedSettings = isNarrowViewport()
        ? { ...settings, cellSize: MOBILE_KUSAMA_CELL_SIZE }
        : settings;
      seeds = createSeeds(instance.width, instance.height, resolvedSettings);
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
      setupSeeds();
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
        instance.width,
        instance.height,
      );

      if (points.length >= 3) {
        const delaunay = Delaunay.from(points);
        const voronoi = delaunay.voronoi([
          0,
          0,
          instance.width,
          instance.height,
        ]);
        const edges = getVoronoiEdges(voronoi, instance.width, instance.height);
        const context = instance.drawingContext as CanvasRenderingContext2D;
        context.save();
        context.translate(
          instance.width * 0.5 + meshTranslateX,
          instance.height * 0.5 + meshTranslateY,
        );
        context.rotate(meshRotate);
        context.scale(meshScale, meshScale);
        context.translate(-instance.width * 0.5, -instance.height * 0.5);
        renderStraightEdges(context, edges, styles);
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
      setupSeeds();
      lastViewportWidth = nextWidth;
      lastViewportHeight = nextHeight;
      lastOrientation = nextOrientation;
    };
  };
}
