const P5_FRAME_RATE_LOW = 18;
const P5_FRAME_RATE_MEDIUM = 24;
const P5_FRAME_RATE_HIGH = 30;

type AdaptiveFrameRateContext = {
  viewportWidth: number;
  viewportHeight: number;
  coarsePointer: boolean;
};

export function resolveAdaptiveP5FrameRate(
  context: AdaptiveFrameRateContext,
): number {
  const width = Math.max(1, context.viewportWidth);
  const height = Math.max(1, context.viewportHeight);
  const viewportPixels = width * height;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const logicalLoad = viewportPixels * dpr * dpr;
  const cores =
    typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
  const memory =
    typeof navigator !== 'undefined' &&
    typeof (navigator as Navigator & { deviceMemory?: number }).deviceMemory ===
      'number'
      ? (navigator as Navigator & { deviceMemory: number }).deviceMemory
      : undefined;

  let score = 0;

  if (cores >= 8) score += 2;
  else if (cores >= 6) score += 1;
  else if (cores <= 2) score -= 2;
  else if (cores <= 4) score -= 1;

  if (typeof memory === 'number') {
    if (memory >= 8) score += 1;
    else if (memory <= 2) score -= 2;
    else if (memory <= 4) score -= 1;
  }

  if (context.coarsePointer) {
    score -= 1;
  }

  if (logicalLoad > 8_500_000) score -= 2;
  else if (logicalLoad > 5_000_000) score -= 1;

  if (score >= 2) return P5_FRAME_RATE_HIGH;
  if (score >= 0) return P5_FRAME_RATE_MEDIUM;

  return P5_FRAME_RATE_LOW;
}
