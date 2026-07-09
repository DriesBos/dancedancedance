const SAFE_EXTERNAL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);
const URL_SCHEME_PATTERN = /^[a-z][a-z\d+.-]*:/i;

export const getSafeExternalHref = (
  href?: string | null,
): string | undefined => {
  const value = href?.trim();
  if (!value || !URL_SCHEME_PATTERN.test(value)) return undefined;

  try {
    const url = new URL(value);
    if (!SAFE_EXTERNAL_PROTOCOLS.has(url.protocol)) return undefined;
    if ((url.protocol === 'http:' || url.protocol === 'https:') && !url.hostname) {
      return undefined;
    }
    return value;
  } catch {
    return undefined;
  }
};
