import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { getStoryblokApi } from '@/lib/storyblok';
import {
  STORYBLOK_TAG_ALL,
  STORYBLOK_TAG_PROJECTS,
  getStoryblokTagsForSlug,
  normalizeStorySlug,
} from '@/lib/storyblok-cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type StoryblokWebhookPayload = {
  action?: string;
  full_slug?: string;
  slug?: string;
  story?: {
    full_slug?: string;
    slug?: string;
  };
  stories?: Array<{
    full_slug?: string;
    slug?: string;
  }>;
};

const getIncomingSecret = (request: NextRequest): string | null =>
  request.nextUrl.searchParams.get('secret') ||
  request.headers.get('x-webhook-secret') ||
  request.headers.get('x-storyblok-secret');

const extractSlugs = (payload: StoryblokWebhookPayload): string[] => {
  const slugs = new Set<string>();
  const addSlug = (value?: string) => {
    if (!value) return;
    slugs.add(normalizeStorySlug(value));
  };

  addSlug(payload.full_slug);
  addSlug(payload.slug);
  addSlug(payload.story?.full_slug);
  addSlug(payload.story?.slug);

  if (Array.isArray(payload.stories)) {
    for (const story of payload.stories) {
      addSlug(story?.full_slug);
      addSlug(story?.slug);
    }
  }

  return Array.from(slugs);
};

const flushStoryblokMemoryCache = () => {
  const flushedCaches: string[] = [];

  const tryFlush = (preview: boolean, label: string) => {
    try {
      const api = getStoryblokApi(preview) as { flushCache?: () => void };
      if (typeof api.flushCache === 'function') {
        api.flushCache();
        flushedCaches.push(label);
      }
    } catch {
      // Ignore missing token/config errors. Revalidation should still continue.
    }
  };

  tryFlush(false, 'published');
  tryFlush(true, 'preview');

  return flushedCaches;
};

export async function POST(request: NextRequest) {
  const configuredSecret = process.env.STORYBLOK_REVALIDATE_SECRET;
  if (!configuredSecret) {
    return NextResponse.json(
      { error: 'Missing STORYBLOK_REVALIDATE_SECRET' },
      { status: 500 },
    );
  }

  const incomingSecret = getIncomingSecret(request);
  if (!incomingSecret || incomingSecret !== configuredSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: StoryblokWebhookPayload = {};
  try {
    payload = (await request.json()) as StoryblokWebhookPayload;
  } catch {
    // Ignore non-JSON payloads and fall back to global invalidation.
  }

  const slugs = extractSlugs(payload);

  const tags = new Set<string>([STORYBLOK_TAG_ALL]);
  for (const slug of slugs) {
    for (const tag of getStoryblokTagsForSlug(slug)) {
      tags.add(tag);
    }
  }

  if (slugs.length === 0) {
    // Safe fallback: revalidate project list cache too if webhook payload doesn't include slugs.
    tags.add(STORYBLOK_TAG_PROJECTS);
  }

  for (const tag of tags) {
    revalidateTag(tag);
  }

  const paths = new Set<string>(['/', '/projects']);
  for (const slug of slugs) {
    if (slug === 'home') {
      paths.add('/');
    } else {
      paths.add(`/${slug}`);
    }

    if (slug === 'projects' || slug.startsWith('projects/')) {
      paths.add('/projects');
    }
  }

  for (const path of paths) {
    revalidatePath(path);
  }
  revalidatePath('/', 'layout');

  const flushedCaches = flushStoryblokMemoryCache();

  return NextResponse.json({
    revalidated: true,
    action: payload.action || 'unknown',
    slugs,
    tags: Array.from(tags),
    paths: Array.from(paths),
    flushedCaches,
    now: new Date().toISOString(),
  });
}
