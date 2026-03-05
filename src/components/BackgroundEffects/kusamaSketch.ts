import type p5 from 'p5';
import { Delaunay } from 'd3-delaunay';

export type KusamaParams = {
  cellSize: number;
  jitter: number;
  driftAmplitude: number;
  driftSpeed: number;
  rippleRadius: number;
  rippleStrength: number;
  lineThickness: number;
  opacity: number;
};

export const KUSAMA_DEFAULT_PARAMS: KusamaParams = {
  cellSize: 74,
  jitter: 0.32,
  driftAmplitude: 1.1,
  driftSpeed: 0.001,
  rippleRadius: 180,
  rippleStrength: 2.4,
  lineThickness: 1,
  opacity: 0.95,
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
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function createSeeds(width: number, height: number, params: KusamaParams): KusamaSeed[] {
  const spacing = Math.max(32, params.cellSize);
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
        freqX: 0.85 + Math.random() * 0.5,
        freqY: 0.85 + Math.random() * 0.5,
        ampScale: 0.7 + Math.random() * 0.6,
      });
    }
  }

  return seeds;
}

function resolveStyles(host: HTMLElement, params: KusamaParams): ResolvedStyles {
  const computedStyles = getComputedStyle(host);
  const backgroundColor =
    computedStyles.getPropertyValue('--be-kusama-bg-color').trim() || '#f4eee2';
  const lineColor =
    computedStyles.getPropertyValue('--be-kusama-line-color').trim() || '#ba3a52';
  const rawWidth = computedStyles.getPropertyValue('--be-kusama-line-width').trim();
  const parsedWidth = Number.parseFloat(rawWidth);
  const cssWidth = Number.isFinite(parsedWidth) && parsedWidth > 0 ? parsedWidth : 1;

  return {
    backgroundColor,
    lineColor,
    lineWidth:
      Number.isFinite(params.lineThickness) && params.lineThickness > 0
        ? params.lineThickness
        : cssWidth,
    opacity: clamp01(params.opacity),
  };
}

function buildAnimatedPoints(
  seeds: KusamaSeed[],
  params: KusamaParams,
  pointer: PointerState,
  width: number,
  height: number,
  elapsedSeconds: number,
  prefersReducedMotion: boolean,
): [number, number][] {
  const points: [number, number][] = [];
  const radius = Math.max(24, params.rippleRadius);
  const radiusSq = radius * radius;
  const baseDrift = prefersReducedMotion ? 0 : params.driftAmplitude;

  for (const seed of seeds) {
    let x =
      seed.anchorX
      + Math.sin(elapsedSeconds * params.driftSpeed * seed.freqX + seed.phaseX)
        * baseDrift
        * seed.ampScale;
    let y =
      seed.anchorY
      + Math.cos(elapsedSeconds * params.driftSpeed * seed.freqY + seed.phaseY)
        * baseDrift
        * seed.ampScale;

    if (pointer.intensity > 0) {
      const dx = x - pointer.x;
      const dy = y - pointer.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < radiusSq) {
        const dist = Math.max(0.0001, Math.sqrt(distSq));
        const normalizedDx = dx / dist;
        const normalizedDy = dy / dist;
        const falloff = Math.exp(-distSq / (radiusSq * 0.65));
        const push = params.rippleStrength * pointer.intensity * falloff;
        x += normalizedDx * push;
        y += normalizedDy * push;
      }
    }

    points.push([clamp(x, -8, width + 8), clamp(y, -8, height + 8)]);
  }

  return points;
}

export function createKusamaSketch(options: KusamaSketchOptions) {
  const settings: KusamaParams = {
    ...KUSAMA_DEFAULT_PARAMS,
    ...options.params,
  };

  return (instance: p5) => {
    let seeds: KusamaSeed[] = [];
    let styles = resolveStyles(options.host, settings);
    const pointer: PointerState = {
      active: false,
      x: 0,
      y: 0,
      intensity: 0,
    };
    let prefersReducedMotion = false;

    const setupSeeds = () => {
      seeds = createSeeds(instance.width, instance.height, settings);
    };

    const updatePointer = (x: number, y: number, boost: number) => {
      pointer.active = true;
      pointer.x = x;
      pointer.y = y;
      pointer.intensity = Math.max(pointer.intensity, clamp01(boost));
    };

    instance.setup = () => {
      const canvas = instance.createCanvas(instance.windowWidth, instance.windowHeight);
      canvas.parent(options.host);
      if (options.canvasClassName) {
        canvas.elt.className = options.canvasClassName;
      }

      instance.pixelDensity(1);
      instance.frameRate(30);
      prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      setupSeeds();
    };

    instance.draw = () => {
      styles = resolveStyles(options.host, settings);
      instance.background(styles.backgroundColor);

      const points = buildAnimatedPoints(
        seeds,
        settings,
        pointer,
        instance.width,
        instance.height,
        instance.millis() * 0.06,
        prefersReducedMotion,
      );

      if (points.length >= 3) {
        const delaunay = Delaunay.from(points);
        const voronoi = delaunay.voronoi([0, 0, instance.width, instance.height]);
        const context = instance.drawingContext as CanvasRenderingContext2D;
        context.save();
        context.globalAlpha = styles.opacity;
        context.beginPath();
        voronoi.render(context);
        context.lineWidth = styles.lineWidth;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = styles.lineColor;
        context.stroke();
        context.restore();
      }

      if (pointer.active) {
        pointer.intensity *= 0.92;
        if (pointer.intensity < 0.01) {
          pointer.intensity = 0;
          pointer.active = false;
        }
      }
    };

    instance.mouseMoved = () => {
      updatePointer(instance.mouseX, instance.mouseY, 0.3);
      return false;
    };

    instance.mouseDragged = () => {
      updatePointer(instance.mouseX, instance.mouseY, 0.45);
      return false;
    };

    (instance as any).mouseOut = () => {
      pointer.active = false;
    };

    (instance as any).touchMoved = () => {
      const touches = ((instance as any).touches ?? []) as Array<{
        x: number;
        y: number;
      }>;
      if (touches.length > 0) {
        const point = touches[0];
        updatePointer(point.x, point.y, 0.35);
      }
      return false;
    };

    (instance as any).touchEnded = () => {
      pointer.active = false;
      return false;
    };

    instance.windowResized = () => {
      instance.resizeCanvas(instance.windowWidth, instance.windowHeight);
      setupSeeds();
    };
  };
}
