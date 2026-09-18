import { StoryblokStory } from '@storyblok/react/rsc';
import { fetchStory } from '@/utils/fetchstory';
import PageTransition from '@/components/PageTransition';
import StackTimelineBehavior from '@/components/StackTimelineBehavior';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cacheLife, cacheTag } from 'next/cache';
import { transformStoryblokImageUrl } from '@/lib/storyblok-image';
import { fetchPublishedStoryList } from '@/lib/storyblok-stories';
import { addStoryblokImageBlurs } from '@/lib/storyblok-image-blur';
import { getStoryblokTagsForSlug } from '@/lib/storyblok-cache';

const HOME_TITLE = 'Freelance Creative Developer & Web Designer | Dries Bos';
const HOME_DESCRIPTION =
  'Dries Bos designs and develops high-end websites, ecommerce experiences and interactive products for creative agencies, studios and startups worldwide.';

type Params = Promise<{ slug?: string[] }>;

type MetadataStory = {
  name?: string;
  content?: {
    component?: string;
    title?: string;
    description?: string;
    category?: string[];
    thumbnail?: {
      filename?: string;
      alt?: string;
    };
  };
};

type StaticParamStory = {
  slug?: string;
  full_slug?: string;
  is_folder?: boolean;
};

const buildPageMetadata = ({
  title,
  description,
  canonical,
  imageUrl = '/og-image.png',
  imageAlt = title,
}: {
  title: string;
  description: string;
  canonical: string;
  imageUrl?: string;
  imageAlt?: string;
}): Metadata => ({
  title,
  description,
  alternates: { canonical },
  openGraph: {
    type: 'website',
    url: canonical,
    siteName: 'Dries Bos',
    locale: 'en_US',
    title,
    description,
    images: [{ url: imageUrl, width: 1200, height: 630, alt: imageAlt }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [imageUrl],
  },
});

const getStoryVersion = (): 'draft' | 'published' => {
  const useDraftInDev =
    process.env.NODE_ENV === 'development' &&
    process.env.STORYBLOK_USE_DRAFT === 'true';

  return useDraftInDev ? 'draft' : 'published';
};

const getSlugPath = (slug?: string[]) =>
  slug && slug.length > 0 ? slug.join('/') : '';

// While prerendering the App Shell for unresolved slugs, `params` never
// resolves and Next rejects it (HANGING_PROMISE_REJECTION) to mark the
// metadata as request-time. That signal must reach Next, so rethrow it.
const isPrerenderInterrupt = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  (error as { digest?: unknown }).digest === 'HANGING_PROMISE_REJECTION';

// 'use cache' caches the whole function call keyed on its arguments, so a
// draft call would get cached too if this branched internally. Keep the
// published path here (cached, tagged for the Storyblok webhook) and let the
// plain getPageData() below call fetchStory directly, uncached, for draft.
async function getCachedPageData(slugPath: string) {
  'use cache';
  cacheLife('max');
  cacheTag(...getStoryblokTagsForSlug(slugPath || 'home'));

  const slug = slugPath ? slugPath.split('/') : undefined;
  const pageData = await fetchStory('published', slug);
  if (!pageData?.story) return pageData;

  return {
    ...pageData,
    story: {
      ...pageData.story,
      content: await addStoryblokImageBlurs(pageData.story.content, true),
    },
  };
}

const getPageData = async (version: 'draft' | 'published', slugPath: string) => {
  if (version === 'published') {
    return getCachedPageData(slugPath);
  }

  const slug = slugPath ? slugPath.split('/') : undefined;
  const pageData = await fetchStory('draft', slug);
  if (!pageData?.story) return pageData;

  return {
    ...pageData,
    story: {
      ...pageData.story,
      content: await addStoryblokImageBlurs(pageData.story.content, false),
    },
  };
};

export async function generateStaticParams(): Promise<Array<{ slug: string[] }>> {
  try {
    const stories = await fetchPublishedStoryList<StaticParamStory>();
    const paths = new Set<string>(['']);

    for (const story of stories) {
      if (story.is_folder) continue;
      const path = (story.full_slug || story.slug || '').replace(/^\/+|\/+$/g, '');
      if (!path || path === 'home') continue;
      paths.add(path);
    }

    return Array.from(paths, (path) => ({
      slug: path ? path.split('/') : [],
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [{ slug: [] }];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  try {
    const slug = (await params).slug;
    const version = getStoryVersion();
    const slugPath = getSlugPath(slug);
    const pageData = await getPageData(version, slugPath);

    if (!pageData || !pageData.story) {
      return {
        title: '404 — Page Not Found | Dries Bos',
        description: 'The page you requested could not be found.',
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const story = pageData.story as MetadataStory;
    const storyName = story.name || '';
    const storySlug = slugPath;
    const canonical = storySlug ? `/${storySlug}` : '/';

    // Home page
    if (!slug || slug.length === 0 || storySlug === 'home') {
      return buildPageMetadata({
        title: HOME_TITLE,
        description: HOME_DESCRIPTION,
        canonical: '/',
      });
    }

    // About page
    if (storySlug === 'about') {
      return buildPageMetadata({
        title: 'About Dries Bos | Freelance Creative Developer',
        description:
          'Meet Dries Bos, a freelance creative developer and web designer creating websites, ecommerce experiences and interactive digital products worldwide.',
        canonical,
      });
    }

    if (story.content?.component === 'Page Project') {
      const title = story.content.title || storyName;
      const categories = story.content.category?.filter(Boolean).join(', ');
      const description =
        story.content.description?.trim() ||
        `Case study: ${title} by Dries Bos, freelance creative developer and web designer${
          categories ? `, covering ${categories}` : ''
        }.`;
      const thumbnail = story.content.thumbnail;
      const imageUrl = thumbnail?.filename
        ? transformStoryblokImageUrl(thumbnail.filename, {
            width: 1200,
            height: 630,
            smart: true,
          })
        : undefined;

      return buildPageMetadata({
        title: `${title} | Creative Development by Dries Bos`,
        description,
        canonical,
        imageUrl,
        imageAlt: thumbnail?.alt || title,
      });
    }

    // Default for other pages
    return buildPageMetadata({
      title: `Dries Bos — ${storyName}`,
      description: `${storyName} — Dries Bos`,
      canonical,
    });
  } catch (error) {
    if (isPrerenderInterrupt(error)) throw error;
    console.error('Error generating metadata:', error);
    return {
      title: 'Dries Bos',
    };
  }
}

// Unknown slugs are 404s or freshly published stories; block instead of
// serving an App Shell so the header and page ship inline in the HTML.
export const instant = false;

export default async function Home({ params }: { params: Params }) {
  const slug = (await params).slug;
  const version = getStoryVersion();
  const slugPath = getSlugPath(slug);
  const pageData = await getPageData(version, slugPath);

  if (!pageData?.story) {
    notFound();
  }

  const story = pageData.story as MetadataStory;
  const isHome = !slug || slug.length === 0 || slugPath === 'home';
  const storyTitle = story.content?.title || story.name || 'Dries Bos';
  const pageHeading = isHome
    ? 'Dries Bos — Freelance Creative Developer and Web Designer'
    : slugPath === 'about'
      ? 'About Dries Bos — Freelance Creative Developer and Web Designer'
      : story.content?.component === 'Page Project'
        ? `${storyTitle} — Creative Development Case Study`
        : storyTitle;

  return (
    <PageTransition>
      {/* Mounted inside the page's Suspense boundary so its DOM writes
          (data-stack-timeline, --stack-z) land after the bloks have hydrated. */}
      <StackTimelineBehavior />
      <h1 className="visuallyHidden">{pageHeading}</h1>
      <StoryblokStory story={pageData.story} />
    </PageTransition>
  );
}
