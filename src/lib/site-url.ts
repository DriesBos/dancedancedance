const DEFAULT_SITE_URL = 'https://www.driesbos.com';

export const getSiteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');
