export const STORYBLOK_TAG_ALL = 'storyblok';
export const STORYBLOK_TAG_PROJECTS = 'storyblok:projects';

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
    getStoryblokSlugTag(normalizedSlug),
  ]);

  if (normalizedSlug === 'projects' || normalizedSlug.startsWith('projects/')) {
    tags.add(STORYBLOK_TAG_PROJECTS);
  }

  return Array.from(tags);
};
