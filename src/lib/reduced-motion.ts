const REDUCED_MOTION_MEDIA_QUERY = '(prefers-reduced-motion: reduce)';
const PORTRAIT_ORIENTATION_MEDIA_QUERY = '(orientation: portrait)';

const hasMatchMedia = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function';

export const getReducedMotionMediaQuery = () => REDUCED_MOTION_MEDIA_QUERY;

export const getPortraitOrientationMediaQuery = () =>
  PORTRAIT_ORIENTATION_MEDIA_QUERY;

export const isPortraitOrientation = () => {
  if (!hasMatchMedia()) return false;
  return window.matchMedia(PORTRAIT_ORIENTATION_MEDIA_QUERY).matches;
};

export const shouldApplyReducedMotion = () => {
  if (!hasMatchMedia()) return false;
  const prefersReducedMotion = window.matchMedia(
    REDUCED_MOTION_MEDIA_QUERY,
  ).matches;

  return prefersReducedMotion && !isPortraitOrientation();
};
