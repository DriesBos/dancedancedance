export const DEFAULT_VIBRATION_DURATION_MS = 300;

export const vibrate = (durationMs = DEFAULT_VIBRATION_DURATION_MS): boolean =>
  typeof navigator !== 'undefined' && (navigator.vibrate?.(durationMs) ?? false);
