import type p5 from 'p5';

const EPSILON = 1e-9;
const POINT_EPSILON = 1e-6;
const MIN_REGION_AREA = 1e-6;
const MIN_SPLITTABLE_AREA_PX = 9;
const MIN_SPLITTABLE_DIMENSION_PX = 3;
const MAX_SPLIT_ATTEMPTS = 24;
const MAX_REGION_ATTEMPTS_PER_RUN = 8;
const MAX_REGION_FAILURES = 2;
const AREA_BUCKETS_PER_LOG2 = 4;
const AREA_BUCKET_COUNT = 128;
const NEAR_SQUARE_THRESHOLD = 0.75;
const ANCHOR_MARGIN_RATIO = 0.05;
const ANCHOR_BAND_START = 0.1;
const ANCHOR_BAND_SPAN = 0.8;
const MOBILE_VIEWPORT_DELTA_IGNORE_PX = 200;

type Point = {
  x: number;
  y: number;
};

type Region = {
  poly: Point[];
  area: number;
  bbox: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  selectionWeight: number;
  splitFailures: number;
};

type RegionPool = {
  buckets: Region[][];
  bucketCounts: number[];
  bucketWeightSums: number[];
  totalCount: number;
};

type SegmentsState = {
  regionPool: RegionPool;
};

type InkStyle = {
  backgroundColor: string;
  strokeColor: string;
  lineThickness: number;
};

export type SegmentsParams = {
  angle: number;
  verticalBias: number;
  fairness: number;
  uniformity: number;
  lineThickness: number;
  opacity: number;
  speed: number;
  hue: number;
  saturation: number;
  lightness: number;
  fill: boolean;
};

export const SEGMENTS_DEFAULT_PARAMS: SegmentsParams = {
  angle: 0,
  verticalBias: 0.5,
  fairness: 0.5,
  uniformity: 0.5,
  lineThickness: 1,
  opacity: 1,
  speed: 1,
  hue: 0,
  saturation: 0,
  lightness: 0,
  fill: false,
};

type SegmentsSketchOptions = {
  host: HTMLDivElement;
  canvasClassName?: string;
  params?: Partial<SegmentsParams>;
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function subtract(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}

function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

function multiply(point: Point, scalar: number): Point {
  return { x: point.x * scalar, y: point.y * scalar };
}

function dot(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y;
}

function cross(a: Point, b: Point): number {
  return a.x * b.y - a.y * b.x;
}

function polygonSignedArea(poly: Point[]): number {
  let area = 0;
  for (let i = 0; i < poly.length; i += 1) {
    const current = poly[i];
    const next = poly[(i + 1) % poly.length];
    area += current.x * next.y - next.x * current.y;
  }
  return area * 0.5;
}

function polygonArea(poly: Point[]): number {
  return Math.abs(polygonSignedArea(poly));
}

function polygonBoundingBox(poly: Point[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const point of poly) {
    if (point.x < minX) minX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.x > maxX) maxX = point.x;
    if (point.y > maxY) maxY = point.y;
  }

  return {
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY,
  };
}

function polygonCentroid(poly: Point[]): Point {
  const signedArea = polygonSignedArea(poly);
  if (Math.abs(signedArea) < EPSILON) {
    let sumX = 0;
    let sumY = 0;
    for (const point of poly) {
      sumX += point.x;
      sumY += point.y;
    }

    return {
      x: sumX / Math.max(1, poly.length),
      y: sumY / Math.max(1, poly.length),
    };
  }

  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < poly.length; i += 1) {
    const current = poly[i];
    const next = poly[(i + 1) % poly.length];
    const crossTerm = current.x * next.y - next.x * current.y;
    sumX += (current.x + next.x) * crossTerm;
    sumY += (current.y + next.y) * crossTerm;
  }

  return {
    x: sumX / (6 * signedArea),
    y: sumY / (6 * signedArea),
  };
}

function pointInConvexPolygon(point: Point, poly: Point[]): boolean {
  if (poly.length < 3) return false;

  let sign = 0;
  for (let i = 0; i < poly.length; i += 1) {
    const current = poly[i];
    const next = poly[(i + 1) % poly.length];
    const crossValue = cross(subtract(next, current), subtract(point, current));
    const nextSign = crossValue > EPSILON ? 1 : crossValue < -EPSILON ? -1 : 0;

    if (nextSign === 0) continue;
    if (sign === 0) {
      sign = nextSign;
      continue;
    }
    if (sign !== nextSign) return false;
  }

  return true;
}

function cleanPolygonPoints(points: Point[]): Point[] {
  const cleaned: Point[] = [];
  for (const point of points) {
    const previous = cleaned[cleaned.length - 1];
    if (
      !previous ||
      Math.hypot(point.x - previous.x, point.y - previous.y) > POINT_EPSILON
    ) {
      cleaned.push(point);
    }
  }

  if (cleaned.length >= 2) {
    const first = cleaned[0];
    const last = cleaned[cleaned.length - 1];
    if (Math.hypot(first.x - last.x, first.y - last.y) <= POINT_EPSILON) {
      cleaned.pop();
    }
  }

  return cleaned;
}

function clipPolygonHalfPlane(
  poly: Point[],
  linePoint: Point,
  normal: Point,
  keepPositiveSide: boolean,
): Point[] {
  if (poly.length === 0) return [];

  const sideOf = (point: Point) => dot(subtract(point, linePoint), normal);
  const inside = (side: number) =>
    keepPositiveSide ? side >= -EPSILON : side <= EPSILON;

  const output: Point[] = [];
  for (let i = 0; i < poly.length; i += 1) {
    const current = poly[i];
    const next = poly[(i + 1) % poly.length];
    const currentSide = sideOf(current);
    const nextSide = sideOf(next);
    const currentInside = inside(currentSide);
    const nextInside = inside(nextSide);

    if (currentInside) output.push(current);

    if (currentInside !== nextInside) {
      const denominator = currentSide - nextSide;
      if (Math.abs(denominator) > EPSILON) {
        const t = currentSide / denominator;
        output.push(add(current, multiply(subtract(next, current), t)));
      }
    }
  }

  return cleanPolygonPoints(output);
}

function linePolygonSegment(
  poly: Point[],
  linePoint: Point,
  direction: Point,
): [Point, Point] | null {
  const intersections: { point: Point }[] = [];

  for (let i = 0; i < poly.length; i += 1) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const edge = subtract(b, a);
    const denominator = cross(direction, edge);

    if (Math.abs(denominator) < EPSILON) continue;

    const rhs = subtract(a, linePoint);
    const t = cross(rhs, edge) / denominator;
    const u = cross(rhs, direction) / denominator;

    if (u < -POINT_EPSILON || u > 1 + POINT_EPSILON) continue;

    intersections.push({
      point: add(linePoint, multiply(direction, t)),
    });
  }

  const unique: { point: Point }[] = [];
  for (const hit of intersections) {
    const duplicate = unique.some(
      (existing) =>
        Math.hypot(
          hit.point.x - existing.point.x,
          hit.point.y - existing.point.y,
        ) <= POINT_EPSILON,
    );
    if (!duplicate) unique.push(hit);
  }

  if (unique.length < 2) return null;

  let bestPair: [Point, Point] | null = null;
  let bestDistance = -1;
  for (let i = 0; i < unique.length; i += 1) {
    for (let j = i + 1; j < unique.length; j += 1) {
      const pointA = unique[i].point;
      const pointB = unique[j].point;
      const distance = (pointA.x - pointB.x) ** 2 + (pointA.y - pointB.y) ** 2;
      if (distance > bestDistance) {
        bestDistance = distance;
        bestPair = [pointA, pointB];
      }
    }
  }

  return bestPair;
}

function splitPolygonByLine(
  poly: Point[],
  linePoint: Point,
  direction: Point,
): {
  positive: Point[];
  negative: Point[];
  cutSegment: [Point, Point];
} | null {
  const normal = {
    x: -direction.y,
    y: direction.x,
  };

  const positive = clipPolygonHalfPlane(poly, linePoint, normal, true);
  const negative = clipPolygonHalfPlane(poly, linePoint, normal, false);

  if (positive.length < 3 || negative.length < 3) return null;

  const positiveArea = polygonArea(positive);
  const negativeArea = polygonArea(negative);
  if (positiveArea < MIN_REGION_AREA || negativeArea < MIN_REGION_AREA) {
    return null;
  }

  const cutSegment = linePolygonSegment(poly, linePoint, direction);
  if (!cutSegment) return null;

  return { positive, negative, cutSegment };
}

function createRegion(poly: Point[], selectionWeight = 1): Region | null {
  const area = polygonArea(poly);
  if (area < MIN_REGION_AREA) return null;

  return {
    poly,
    area,
    bbox: polygonBoundingBox(poly),
    selectionWeight: Math.max(0, Number(selectionWeight) || 0),
    splitFailures: 0,
  };
}

function createRootRegion(width: number, height: number): Region | null {
  return createRegion([
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ]);
}

function canSplitVertical(region: Region): boolean {
  return region.bbox.w >= MIN_SPLITTABLE_DIMENSION_PX;
}

function canSplitHorizontal(region: Region): boolean {
  return region.bbox.h >= MIN_SPLITTABLE_DIMENSION_PX;
}

function canRegionSplit(region: Region): boolean {
  return (
    region.area >= MIN_SPLITTABLE_AREA_PX &&
    (canSplitVertical(region) || canSplitHorizontal(region))
  );
}

function chooseVerticalCut(
  region: Region,
  verticalBias: number,
): boolean | null {
  const canVertical = canSplitVertical(region);
  const canHorizontal = canSplitHorizontal(region);

  if (!canVertical && !canHorizontal) return null;
  if (canVertical && !canHorizontal) return true;
  if (!canVertical && canHorizontal) return false;

  const { w, h } = region.bbox;
  if (w <= EPSILON || h <= EPSILON) return clamp01(verticalBias) >= 0.5;

  const squareness = Math.min(w, h) / Math.max(w, h);
  if (squareness > NEAR_SQUARE_THRESHOLD) {
    return Math.random() < clamp01(verticalBias);
  }

  return w >= h;
}

function pickSplitAnchor(region: Region, cutIsVertical: boolean): Point {
  const { bbox, poly } = region;
  const width = Math.max(0, bbox.w);
  const height = Math.max(0, bbox.h);
  const margin = Math.min(
    Math.min(width, height) * 0.45,
    Math.min(width, height) * ANCHOR_MARGIN_RATIO,
  );

  for (let attempt = 0; attempt < MAX_SPLIT_ATTEMPTS; attempt += 1) {
    let x = 0;
    let y = 0;

    if (cutIsVertical) {
      x = bbox.x + margin + Math.random() * Math.max(0, width - margin * 2);
      y =
        bbox.y +
        (ANCHOR_BAND_START + Math.random() * ANCHOR_BAND_SPAN) * height;
    } else {
      y = bbox.y + margin + Math.random() * Math.max(0, height - margin * 2);
      x =
        bbox.x + (ANCHOR_BAND_START + Math.random() * ANCHOR_BAND_SPAN) * width;
    }

    const candidate = { x, y };
    if (pointInConvexPolygon(candidate, poly)) return candidate;
  }

  return polygonCentroid(poly);
}

function attemptRegionSplit(
  region: Region,
  params: SegmentsParams,
): {
  regionA: Region;
  regionB: Region;
  cutStart: Point;
  cutEnd: Point;
} | null {
  if (!canRegionSplit(region)) return null;

  const angleOffsetRadians = (params.angle * Math.PI) / 180;

  for (let attempt = 0; attempt < MAX_SPLIT_ATTEMPTS; attempt += 1) {
    const cutIsVertical = chooseVerticalCut(region, params.verticalBias);
    if (cutIsVertical === null) return null;

    const baseAngle = cutIsVertical ? Math.PI * 0.5 : 0;
    const direction = {
      x: Math.cos(baseAngle + angleOffsetRadians),
      y: Math.sin(baseAngle + angleOffsetRadians),
    };
    const anchor = pickSplitAnchor(region, cutIsVertical);
    const splitResult = splitPolygonByLine(region.poly, anchor, direction);
    if (!splitResult) continue;

    const regionA = createRegion(splitResult.positive);
    const regionB = createRegion(splitResult.negative);
    if (!regionA || !regionB) continue;

    return {
      regionA,
      regionB,
      cutStart: splitResult.cutSegment[0],
      cutEnd: splitResult.cutSegment[1],
    };
  }

  return null;
}

function regionSelectionWeight(region: Region | null | undefined): number {
  return Math.max(0, Number(region?.selectionWeight) || 0);
}

function areaBucketIndex(area: number): number {
  const safeArea = Math.max(1, Number(area) || 1);
  const scaled = Math.floor(Math.log2(safeArea) * AREA_BUCKETS_PER_LOG2);
  return Math.max(0, Math.min(AREA_BUCKET_COUNT - 1, scaled));
}

function createRegionPool(): RegionPool {
  return {
    buckets: Array.from({ length: AREA_BUCKET_COUNT }, () => []),
    bucketCounts: new Array(AREA_BUCKET_COUNT).fill(0),
    bucketWeightSums: new Array(AREA_BUCKET_COUNT).fill(0),
    totalCount: 0,
  };
}

function addRegionToPool(pool: RegionPool, region: Region | null): boolean {
  if (!region || !canRegionSplit(region)) return false;

  const bucketIndex = areaBucketIndex(region.area);
  pool.buckets[bucketIndex].push(region);
  pool.bucketCounts[bucketIndex] += 1;
  pool.bucketWeightSums[bucketIndex] += regionSelectionWeight(region);
  pool.totalCount += 1;
  return true;
}

function popRegionFromPoolBucket(
  pool: RegionPool,
  bucketIndex: number,
  regionIndex: number,
): Region | null {
  const bucket = pool.buckets[bucketIndex];
  if (
    !bucket ||
    bucket.length === 0 ||
    regionIndex < 0 ||
    regionIndex >= bucket.length
  ) {
    return null;
  }

  const lastIndex = bucket.length - 1;
  const region = bucket[regionIndex];
  if (regionIndex !== lastIndex) {
    bucket[regionIndex] = bucket[lastIndex];
  }
  bucket.pop();

  pool.bucketCounts[bucketIndex] = Math.max(
    0,
    pool.bucketCounts[bucketIndex] - 1,
  );
  pool.bucketWeightSums[bucketIndex] = Math.max(
    0,
    pool.bucketWeightSums[bucketIndex] - regionSelectionWeight(region),
  );
  pool.totalCount = Math.max(0, pool.totalCount - 1);

  return region ?? null;
}

function ensureRegionPoolHasRoot(
  state: SegmentsState,
  width: number,
  height: number,
) {
  if (
    !state.regionPool ||
    !Array.isArray(state.regionPool.buckets) ||
    !Array.isArray(state.regionPool.bucketCounts) ||
    !Array.isArray(state.regionPool.bucketWeightSums)
  ) {
    state.regionPool = createRegionPool();
  }

  if (!(state.regionPool.totalCount > 0)) {
    const root = createRootRegion(width, height);
    if (root) addRegionToPool(state.regionPool, root);
  }
}

function selectEligibleBuckets(pool: RegionPool, uniformity: number): number[] {
  const uniformityClamped = clamp01(Number(uniformity) || 0);
  const eligibleFraction = 1 - 0.9 * uniformityClamped;
  const targetCount = Math.max(
    1,
    Math.ceil(pool.totalCount * eligibleFraction),
  );

  const eligibleBuckets: number[] = [];
  let countSoFar = 0;
  for (
    let bucketIndex = AREA_BUCKET_COUNT - 1;
    bucketIndex >= 0;
    bucketIndex -= 1
  ) {
    const bucketCount = pool.bucketCounts[bucketIndex];
    if (!(bucketCount > 0)) continue;

    eligibleBuckets.push(bucketIndex);
    countSoFar += bucketCount;
    if (countSoFar >= targetCount) break;
  }

  return eligibleBuckets;
}

function pickBucketByWeightOrCount(
  pool: RegionPool,
  bucketIndices: number[],
): number {
  if (!bucketIndices.length) return -1;

  let totalWeight = 0;
  for (const bucketIndex of bucketIndices) {
    totalWeight += Math.max(0, pool.bucketWeightSums[bucketIndex]);
  }

  if (totalWeight > 0) {
    let threshold = Math.random() * totalWeight;
    let selected = bucketIndices[bucketIndices.length - 1];
    for (const bucketIndex of bucketIndices) {
      threshold -= Math.max(0, pool.bucketWeightSums[bucketIndex]);
      if (threshold <= 0) {
        selected = bucketIndex;
        break;
      }
    }
    return selected;
  }

  let totalCount = 0;
  for (const bucketIndex of bucketIndices) {
    totalCount += pool.bucketCounts[bucketIndex];
  }

  if (!(totalCount > 0)) return -1;

  let threshold = Math.random() * totalCount;
  let selected = bucketIndices[bucketIndices.length - 1];
  for (const bucketIndex of bucketIndices) {
    threshold -= pool.bucketCounts[bucketIndex];
    if (threshold <= 0) {
      selected = bucketIndex;
      break;
    }
  }

  return selected;
}

function pickRegionIndexInBucket(
  bucket: Region[],
  bucketWeightSum: number,
): number {
  if (!Array.isArray(bucket) || bucket.length === 0) return -1;
  if (!(bucketWeightSum > 0)) return Math.floor(Math.random() * bucket.length);

  let threshold = Math.random() * bucketWeightSum;
  let selected = bucket.length - 1;
  for (let i = 0; i < bucket.length; i += 1) {
    threshold -= regionSelectionWeight(bucket[i]);
    if (threshold <= 0) {
      selected = i;
      break;
    }
  }

  return selected;
}

function popRegionBySelectionWeight(
  pool: RegionPool,
  uniformity: number,
): Region | null {
  if (!(pool?.totalCount > 0)) return null;

  const eligibleBuckets = selectEligibleBuckets(pool, uniformity);
  if (!eligibleBuckets.length) return null;

  const bucketIndex = pickBucketByWeightOrCount(pool, eligibleBuckets);
  if (bucketIndex < 0) return null;

  const bucket = pool.buckets[bucketIndex];
  const regionIndex = pickRegionIndexInBucket(
    bucket,
    pool.bucketWeightSums[bucketIndex],
  );
  if (regionIndex < 0) return null;

  return popRegionFromPoolBucket(pool, bucketIndex, regionIndex);
}

function splitSelectionWeight(parentWeight: number, fairness: number) {
  const safeParentWeight = Math.max(0, Number(parentWeight) || 0);
  const fairnessClamped = clamp01(Number(fairness) || 0);
  const maxDeviationFromCenter = 0.5 - 0.5 * fairnessClamped;
  const split = 0.5 + (Math.random() * 2 - 1) * maxDeviationFromCenter;
  const blendedParentScale =
    safeParentWeight * (1 - fairnessClamped) + fairnessClamped;

  return {
    childAWeight: blendedParentScale * split,
    childBWeight: blendedParentScale * (1 - split),
  };
}

function fillRegionPolygon(
  ctx: CanvasRenderingContext2D,
  poly: Point[],
  fillStyle: string,
) {
  if (!Array.isArray(poly) || poly.length < 3) return;

  ctx.beginPath();
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i += 1) {
    ctx.lineTo(poly[i].x, poly[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function clampSaturationLightness(value: number): number {
  return Math.max(-100, Math.min(100, value));
}

function rgbToHsl(r: number, g: number, b: number) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let hue = 0;
  let saturation = 0;
  const lightness = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;
    saturation =
      lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case red:
        hue = (green - blue) / delta + (green < blue ? 6 : 0);
        break;
      case green:
        hue = (blue - red) / delta + 2;
        break;
      default:
        hue = (red - green) / delta + 4;
        break;
    }

    hue /= 6;
  }

  return {
    h: hue * 360,
    s: saturation * 100,
    l: lightness * 100,
  };
}

function hslToRgb(h: number, s: number, l: number) {
  const hue = ((h % 360) + 360) % 360;
  const saturation = clamp01(s / 100);
  const lightness = clamp01(l / 100);

  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lightness - c / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (hue < 60) {
    rPrime = c;
    gPrime = x;
  } else if (hue < 120) {
    rPrime = x;
    gPrime = c;
  } else if (hue < 180) {
    gPrime = c;
    bPrime = x;
  } else if (hue < 240) {
    gPrime = x;
    bPrime = c;
  } else if (hue < 300) {
    rPrime = x;
    bPrime = c;
  } else {
    rPrime = c;
    bPrime = x;
  }

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255),
  };
}

function parseColor(
  color: string,
): { r: number; g: number; b: number; a: number } | null {
  const parserCanvas = document.createElement('canvas');
  const parserContext = parserCanvas.getContext('2d');
  if (!parserContext) return null;

  parserContext.fillStyle = '#000000';
  parserContext.fillStyle = color;
  const normalized = parserContext.fillStyle;

  if (normalized.startsWith('#')) {
    const hex = normalized.slice(1);
    if (hex.length === 3) {
      const r = Number.parseInt(hex[0] + hex[0], 16);
      const g = Number.parseInt(hex[1] + hex[1], 16);
      const b = Number.parseInt(hex[2] + hex[2], 16);
      return { r, g, b, a: 1 };
    }
    if (hex.length === 6) {
      const r = Number.parseInt(hex.slice(0, 2), 16);
      const g = Number.parseInt(hex.slice(2, 4), 16);
      const b = Number.parseInt(hex.slice(4, 6), 16);
      return { r, g, b, a: 1 };
    }
  }

  const match = normalized.match(/^rgba?\(([^)]+)\)$/i);
  if (!match) return null;
  const parts = match[1]
    .split(',')
    .map((part) => Number.parseFloat(part.trim()))
    .filter((part) => Number.isFinite(part));

  if (parts.length < 3) return null;
  return {
    r: Math.max(0, Math.min(255, parts[0])),
    g: Math.max(0, Math.min(255, parts[1])),
    b: Math.max(0, Math.min(255, parts[2])),
    a: parts.length > 3 ? clamp01(parts[3]) : 1,
  };
}

function withHslaShift(color: string, params: SegmentsParams): string {
  const parsed = parseColor(color);
  if (!parsed) return color;

  const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
  const shifted = {
    h: hsl.h + params.hue,
    s: hsl.s + clampSaturationLightness(params.saturation),
    l: hsl.l + clampSaturationLightness(params.lightness),
  };
  const rgb = hslToRgb(shifted.h, shifted.s, shifted.l);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp01(params.opacity * parsed.a)})`;
}

function resolveInkStyle(host: HTMLElement, params: SegmentsParams): InkStyle {
  const computedStyles = getComputedStyle(host);
  const backgroundColor =
    computedStyles.getPropertyValue('--be-segments-bg-color').trim() ||
    computedStyles.getPropertyValue('--rb-bg-color').trim() ||
    '#ffffff';
  const baseStrokeColor =
    computedStyles.getPropertyValue('--be-segments-line-color').trim() ||
    computedStyles.getPropertyValue('--rb-line-color').trim() ||
    '#000000';

  const rawLineWidth = computedStyles
    .getPropertyValue('--be-segments-line-width')
    .trim();
  const parsedLineWidth = Number.parseFloat(rawLineWidth);
  const cssLineWidth =
    Number.isFinite(parsedLineWidth) && parsedLineWidth > 0
      ? parsedLineWidth
      : 1;

  return {
    backgroundColor,
    strokeColor: withHslaShift(baseStrokeColor, params),
    lineThickness:
      Number.isFinite(params.lineThickness) && params.lineThickness > 0
        ? params.lineThickness
        : cssLineWidth,
  };
}

function runSegmentsStep(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: SegmentsParams,
  state: SegmentsState,
  ink: InkStyle,
): boolean {
  ensureRegionPoolHasRoot(state, width, height);

  const skippedRegions: Region[] = [];
  let split: ReturnType<typeof attemptRegionSplit> = null;
  let selectedRegion: Region | null = null;
  let tries = 0;

  while (
    state.regionPool.totalCount > 0 &&
    tries < MAX_REGION_ATTEMPTS_PER_RUN
  ) {
    const candidateRegion = popRegionBySelectionWeight(
      state.regionPool,
      params.uniformity,
    );
    if (!candidateRegion) break;

    split = attemptRegionSplit(candidateRegion, params);
    if (split) {
      selectedRegion = candidateRegion;
      break;
    }

    candidateRegion.splitFailures =
      (Number(candidateRegion.splitFailures) || 0) + 1;
    if (
      candidateRegion.splitFailures < MAX_REGION_FAILURES &&
      canRegionSplit(candidateRegion)
    ) {
      skippedRegions.push(candidateRegion);
    }
    tries += 1;
  }

  for (const region of skippedRegions) {
    addRegionToPool(state.regionPool, region);
  }

  if (!split) return false;

  const parentWeight = Math.max(
    0,
    Number(selectedRegion?.selectionWeight) || 0,
  );
  const { childAWeight, childBWeight } = splitSelectionWeight(
    parentWeight,
    params.fairness,
  );
  split.regionA.selectionWeight = childAWeight;
  split.regionB.selectionWeight = childBWeight;

  addRegionToPool(state.regionPool, split.regionA);
  addRegionToPool(state.regionPool, split.regionB);

  if (params.fill) {
    const regionToFill = Math.random() < 0.5 ? split.regionA : split.regionB;
    fillRegionPolygon(ctx, regionToFill.poly, ink.strokeColor);
  }

  ctx.beginPath();
  ctx.moveTo(split.cutStart.x, split.cutStart.y);
  ctx.lineTo(split.cutEnd.x, split.cutEnd.y);
  ctx.lineWidth = ink.lineThickness;
  ctx.lineCap = 'butt';
  ctx.strokeStyle = ink.strokeColor;
  ctx.stroke();

  return true;
}

export function createSegmentsSketch(options: SegmentsSketchOptions) {
  const settings: SegmentsParams = {
    ...SEGMENTS_DEFAULT_PARAMS,
    ...options.params,
  };

  return (instance: p5) => {
    const state: SegmentsState = {
      regionPool: createRegionPool(),
    };
    const teardownFns: Array<() => void> = [];

    let ink = resolveInkStyle(options.host, settings);
    let noProgressFrameCount = 0;
    let stepBudget = 0;
    let lastViewportWidth = 0;
    let lastViewportHeight = 0;
    let lastOrientation: 'portrait' | 'landscape' = 'landscape';

    const getOrientation = (width: number, height: number) =>
      width >= height ? 'landscape' : 'portrait';

    const isCoarsePointerDevice = () =>
      window.matchMedia('(pointer: coarse)').matches ||
      (navigator.maxTouchPoints ?? 0) > 0;

    const reset = () => {
      state.regionPool = createRegionPool();
      const root = createRootRegion(instance.width, instance.height);
      if (root) {
        addRegionToPool(state.regionPool, root);
      }

      instance.background(ink.backgroundColor);
      noProgressFrameCount = 0;
      stepBudget = 0;
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
      instance.noFill();
      lastViewportWidth = instance.windowWidth;
      lastViewportHeight = instance.windowHeight;
      lastOrientation = getOrientation(lastViewportWidth, lastViewportHeight);
      reset();

      const handleVisibilityChange = () => {
        if (document.hidden) {
          instance.noLoop();
        } else {
          instance.loop();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      teardownFns.push(() => {
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange,
        );
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
      const nextInk = resolveInkStyle(options.host, settings);
      if (
        nextInk.backgroundColor !== ink.backgroundColor ||
        nextInk.strokeColor !== ink.strokeColor ||
        Math.abs(nextInk.lineThickness - ink.lineThickness) > EPSILON
      ) {
        ink = nextInk;
        reset();
      }

      stepBudget += Math.max(0, settings.speed);
      const steps = Math.floor(stepBudget);
      if (steps <= 0) {
        return;
      }
      stepBudget -= steps;
      let madeProgress = false;

      for (let i = 0; i < steps; i += 1) {
        const stepProgress = runSegmentsStep(
          instance.drawingContext as CanvasRenderingContext2D,
          instance.width,
          instance.height,
          settings,
          state,
          ink,
        );
        madeProgress = madeProgress || stepProgress;
      }

      if (!madeProgress) {
        noProgressFrameCount += 1;
        if (noProgressFrameCount >= 90) {
          reset();
        }
      } else {
        noProgressFrameCount = 0;
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
        viewportDelta < MOBILE_VIEWPORT_DELTA_IGNORE_PX;

      if (isLikelyMobileViewportChurn) {
        return;
      }

      instance.resizeCanvas(nextWidth, nextHeight);
      ink = resolveInkStyle(options.host, settings);
      reset();
      lastViewportWidth = nextWidth;
      lastViewportHeight = nextHeight;
      lastOrientation = nextOrientation;
    };
  };
}
