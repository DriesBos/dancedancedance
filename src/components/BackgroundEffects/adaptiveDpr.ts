const MAX_FRAME_GAP_MS = 250;
const EPSILON = 1e-4;

type AdaptiveDprOptions = {
  minDpr: number;
  maxDpr: number;
  initialDpr: number;
  step?: number;
  lowerFpsThreshold?: number;
  upperFpsThreshold?: number;
  smoothing?: number;
  minSamplesBeforeAdjust?: number;
  cooldownMs?: number;
};

type AdaptiveDprResult = {
  fps: number;
  nextDpr?: number;
};

type AdaptiveDprController = {
  observeFrame: (nowMs: number) => AdaptiveDprResult | null;
  reset: (nowMs?: number) => void;
  getCurrentDpr: () => number;
  setCurrentDpr: (dpr: number, nowMs?: number) => number;
  setBounds: (minDpr: number, maxDpr: number, nowMs?: number) => number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const roundDpr = (value: number) => Math.round(value * 100) / 100;

export const createAdaptiveDprController = (
  options: AdaptiveDprOptions,
): AdaptiveDprController => {
  let minDpr = Math.max(0.5, options.minDpr);
  let maxDpr = Math.max(minDpr, options.maxDpr);

  const step = Math.max(0.01, options.step ?? 0.05);
  const lowerFpsThreshold = options.lowerFpsThreshold ?? 48;
  const upperFpsThreshold = Math.max(
    lowerFpsThreshold + 1,
    options.upperFpsThreshold ?? 57,
  );
  const smoothing = clamp(options.smoothing ?? 0.2, 0.05, 1);
  const minSamplesBeforeAdjust = Math.max(4, options.minSamplesBeforeAdjust ?? 16);
  const cooldownMs = Math.max(250, options.cooldownMs ?? 1250);

  let currentDpr = roundDpr(clamp(options.initialDpr, minDpr, maxDpr));
  let emaFps: number | null = null;
  let sampleCount = 0;
  let lastFrameMs = 0;
  let lastAdjustmentMs = 0;

  const reset = (nowMs = 0) => {
    emaFps = null;
    sampleCount = 0;
    lastFrameMs = nowMs;
  };

  const setCurrentDpr = (dpr: number, nowMs = 0) => {
    const next = roundDpr(clamp(dpr, minDpr, maxDpr));
    if (Math.abs(next - currentDpr) <= EPSILON) {
      return currentDpr;
    }

    currentDpr = next;
    lastAdjustmentMs = nowMs;
    reset(nowMs);

    return currentDpr;
  };

  const setBounds = (nextMinDpr: number, nextMaxDpr: number, nowMs = 0) => {
    minDpr = Math.max(0.5, nextMinDpr);
    maxDpr = Math.max(minDpr, nextMaxDpr);

    const clampedCurrentDpr = roundDpr(clamp(currentDpr, minDpr, maxDpr));
    if (Math.abs(clampedCurrentDpr - currentDpr) <= EPSILON) {
      return currentDpr;
    }

    currentDpr = clampedCurrentDpr;
    lastAdjustmentMs = nowMs;
    reset(nowMs);

    return currentDpr;
  };

  const observeFrame = (nowMs: number): AdaptiveDprResult | null => {
    if (lastFrameMs <= 0) {
      lastFrameMs = nowMs;
      return null;
    }

    const deltaMs = nowMs - lastFrameMs;
    lastFrameMs = nowMs;

    if (deltaMs <= 0) {
      return null;
    }

    if (deltaMs > MAX_FRAME_GAP_MS) {
      reset(nowMs);
      return null;
    }

    const fps = 1000 / deltaMs;
    emaFps = emaFps === null ? fps : emaFps + (fps - emaFps) * smoothing;
    sampleCount += 1;

    if (sampleCount < minSamplesBeforeAdjust) {
      return { fps: emaFps };
    }

    if (nowMs - lastAdjustmentMs < cooldownMs) {
      return { fps: emaFps };
    }

    if (emaFps < lowerFpsThreshold && currentDpr > minDpr + EPSILON) {
      return {
        fps: emaFps,
        nextDpr: setCurrentDpr(currentDpr - step, nowMs),
      };
    }

    if (emaFps > upperFpsThreshold && currentDpr < maxDpr - EPSILON) {
      return {
        fps: emaFps,
        nextDpr: setCurrentDpr(currentDpr + step, nowMs),
      };
    }

    return { fps: emaFps };
  };

  return {
    observeFrame,
    reset,
    getCurrentDpr: () => currentDpr,
    setCurrentDpr,
    setBounds,
  };
};
