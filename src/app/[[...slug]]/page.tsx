import { StoryblokStory } from '@storyblok/react/rsc';
import { fetchStory } from '@/utils/fetchstory';
import { fetchPublishedStoryList } from '@/lib/storyblok-stories';
import PageTransition from '@/components/PageTransition';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { transformStoryblokImageUrl } from '@/lib/storyblok-image';

const HOME_TITLE = 'Freelance Creative Developer & Web Designer | Dries Bos';
const HOME_DESCRIPTION =
  'Dries Bos designs and develops high-end websites, ecommerce experiences and interactive products for creative agencies, studios and startups worldwide.';

// Enable dynamic params for catch-all route
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const stories = await fetchPublishedStoryList<{
      slug?: string;
      full_slug?: string;
      is_folder?: boolean;
    }>();

    const staticParams = stories
      .filter(
        (story) => !story.is_folder && !!story.slug && story.slug !== 'home',
      )
      .map((story) => ({
        slug: (story.full_slug || story.slug!).split('/').filter(Boolean),
      }));

    // Optional catch-all root route (`/`)
    return [{}, ...staticParams];
  } catch (error) {
    console.error('Error generating static params:', error);
    return [{}];
  }
}

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

const getPageData = cache(
  async (version: 'draft' | 'published', slugPath: string) => {
    const slug = slugPath ? slugPath.split('/') : undefined;
    return fetchStory(version, slug);
  },
);

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
    console.error('Error generating metadata:', error);
    return {
      title: 'Dries Bos',
    };
  }
}

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
      <h1 className="visuallyHidden">{pageHeading}</h1>
      <StoryblokStory story={pageData.story} />
    </PageTransition>
  );
}
