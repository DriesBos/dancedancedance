const SHOPIFY_EASE_OUT_BACK_P1_X = 0.34;
const SHOPIFY_EASE_OUT_BACK_P1_Y = 1.56;
const SHOPIFY_EASE_OUT_BACK_P2_X = 0.64;
const SHOPIFY_EASE_OUT_BACK_P2_Y = 1;

const PARALLAX_SETTLE_MIN_DURATION_MS = 180;
const PARALLAX_SETTLE_MAX_DURATION_MS = 400;
const PARALLAX_DISTANCE_FALLOFF_RANGE = 0.75;
const PARALLAX_RETARGET_EPSILON = 1e-4;

export type ParallaxTween = {
  from: number;
  to: number;
  value: number;
  startTimeMs: number;
  durationMs: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(start: number, end: number, alpha: number): number {
  return start + (end - start) * alpha;
}

function cubicBezierCoordinate(t: number, p1: number, p2: number): number {
  const inverse = 1 - t;
  return (
    3 * inverse * inverse * t * p1 +
    3 * inverse * t * t * p2 +
    t * t * t
  );
}

function cubicBezierCoordinateDerivative(
  t: number,
  p1: number,
  p2: number,
): number {
  const inverse = 1 - t;
  return (
    3 * inverse * inverse * p1 +
    6 * inverse * t * (p2 - p1) +
    3 * t * t * (1 - p2)
  );
}

function solveBezierTForX(x: number, p1x: number, p2x: number): number {
  let t = x;

  for (let iteration = 0; iteration < 7; iteration += 1) {
    const currentX = cubicBezierCoordinate(t, p1x, p2x) - x;
    if (Math.abs(currentX) < 1e-6) {
      return t;
    }

    const derivative = cubicBezierCoordinateDerivative(t, p1x, p2x);
    if (Math.abs(derivative) < 1e-6) {
      break;
    }

    t -= currentX / derivative;
    if (t < 0 || t > 1) {
      break;
    }
  }

  let lower = 0;
  let upper = 1;
  t = x;
  for (let iteration = 0; iteration < 10; iteration += 1) {
    const currentX = cubicBezierCoordinate(t, p1x, p2x);
    if (Math.abs(currentX - x) < 1e-6) {
      return t;
    }

    if (currentX < x) {
      lower = t;
    } else {
      upper = t;
    }
    t = (lower + upper) * 0.5;
  }

  return t;
}

function easeOutBack(progress: number): number {
  if (progress <= 0) return 0;
  if (progress >= 1) return 1;

  const t = solveBezierTForX(
    progress,
    SHOPIFY_EASE_OUT_BACK_P1_X,
    SHOPIFY_EASE_OUT_BACK_P2_X,
  );
  return cubicBezierCoordinate(
    t,
    SHOPIFY_EASE_OUT_BACK_P1_Y,
    SHOPIFY_EASE_OUT_BACK_P2_Y,
  );
}

function getDurationForDelta(delta: number): number {
  const normalizedDistance = clamp(
    delta / PARALLAX_DISTANCE_FALLOFF_RANGE,
    0,
    1,
  );
  // Quadratic fall-off keeps larger motion responsive and gives slower settling near rest.
  const falloff = 1 - normalizedDistance * normalizedDistance;

  return lerp(
    PARALLAX_SETTLE_MIN_DURATION_MS,
    PARALLAX_SETTLE_MAX_DURATION_MS,
    falloff,
  );
}

export function createParallaxTween(initialValue = 0): ParallaxTween {
  return {
    from: initialValue,
    to: initialValue,
    value: initialValue,
    startTimeMs: 0,
    durationMs: PARALLAX_SETTLE_MAX_DURATION_MS,
  };
}

export function sampleParallaxTween(
  tween: ParallaxTween,
  nowMs: number,
): number {
  if (tween.durationMs <= 0) {
    tween.value = tween.to;
    tween.from = tween.to;
    return tween.value;
  }

  const elapsed = nowMs - tween.startTimeMs;
  const progress = clamp(elapsed / tween.durationMs, 0, 1);
  const eased = easeOutBack(progress);
  tween.value = lerp(tween.from, tween.to, eased);

  if (progress >= 1) {
    tween.from = tween.to;
    tween.value = tween.to;
  }

  return tween.value;
}

export function retargetParallaxTween(
  tween: ParallaxTween,
  nextValue: number,
  nowMs: number,
): void {
  const currentValue = sampleParallaxTween(tween, nowMs);
  if (
    Math.abs(nextValue - tween.to) < PARALLAX_RETARGET_EPSILON &&
    Math.abs(currentValue - tween.to) < PARALLAX_RETARGET_EPSILON
  ) {
    return;
  }

  tween.from = currentValue;
  tween.to = nextValue;
  tween.startTimeMs = nowMs;
  tween.durationMs = getDurationForDelta(Math.abs(nextValue - currentValue));
}

export function snapParallaxTween(tween: ParallaxTween, value: number): void {
  tween.from = value;
  tween.to = value;
  tween.value = value;
  tween.startTimeMs = 0;
  tween.durationMs = 0;
}
