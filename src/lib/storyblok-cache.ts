// Every Storyblok fetch rendered by a page carries the tags below, and the
// `'use cache'` functions in page.tsx and fetch-projects.ts cacheTag the same
// names; the Storyblok webhook purges them (see src/app/api/storyblok/revalidate/route.ts).
// Next derives a route's `s-maxage` from the lowest `revalidate` of the fetches
// and `cacheLife` profiles it renders (`max` is redefined to one year in
// next.config.mjs), and the Netlify adapter turns that into
// `Netlify-CDN-Cache-Control: s-maxage=<n>, stale-while-revalidate=..., durable`.
// Keeping this at one year lets the Netlify edge serve pages without a round
// trip to the durable cache; freshness comes from the webhook purge, not the clock.
export const STORYBLOK_REVALIDATE_SECONDS = 31536000;

export const STORYBLOK_TAG_ALL = 'storyblok';
export const STORYBLOK_TAG_PROJECTS = 'storyblok:projects';
export const STORYBLOK_TAG_CV = 'storyblok:cv';

export const normalizeStorySlug = (slug?: string | null): string => {
  if (!slug) return 'home';
  const normalized = slug.trim().replace(/^\/+|\/+$/g, '');
  return normalized.length > 0 ? normalized : 'home';
};

export const getStoryblokSlugTag = (slug?: string | null): string =>
  `storyblok:slug:${normalizeStorySlug(slug)}`;

export const getStoryblokTagsForSlug = (slug?: string | null): string[] => {
  const normalizedSlug = normalizeStorySlug(slug);
  const tags = new Set<string>([
    STORYBLOK_TAG_ALL,
    `storyblok:slug:${normalizedSlug}`,
  ]);

  if (normalizedSlug === 'projects' || normalizedSlug.startsWith('projects/')) {
    tags.add(STORYBLOK_TAG_PROJECTS);
  }

  return Array.from(tags);
};
