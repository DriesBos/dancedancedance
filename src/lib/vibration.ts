export const DEFAULT_VIBRATION_DURATION_MS = 300;

type VibrationNavigator = Navigator & {
  vibrate?: (pattern: number | number[]) => boolean;
};

export function canVibrate(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  return typeof (navigator as VibrationNavigator).vibrate === 'function';
}

export function vibrate(durationMs = DEFAULT_VIBRATION_DURATION_MS): boolean {
  if (!canVibrate()) {
    return false;
  }

  return (navigator as VibrationNavigator).vibrate?.(durationMs) ?? false;
}
