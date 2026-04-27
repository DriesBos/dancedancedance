import { ISbStoriesParams } from '@storyblok/react/rsc';
import { getStoryblokAccessToken, getStoryblokApi } from '@/lib/storyblok';
import { STORYBLOK_TAG_ALL, STORYBLOK_TAG_PROJECTS } from '@/lib/storyblok-cache';
import { withPublishedStoryblokCv } from '@/lib/storyblok-cv';

export interface ProjectData {
  slug: string;
  year?: string;
  title?: string;
  category?: string[];
  highlight?: boolean;
  thumbnail?: {
    filename: string;
    alt?: string;
  };
  external_link?: { cached_url: string };
}

type StoryblokProjectStory = {
  slug: string;
  content: {
    year?: string;
    title?: string;
    category?: string[];
    highlight?: boolean;
    thumbnail?: ProjectData['thumbnail'];
    external_link?: ProjectData['external_link'];
  };
};

export async function fetchProjectData(): Promise<ProjectData[]> {
  const sbParams: ISbStoriesParams = {
    version: 'published',
    starts_with: 'projects',
    is_startpage: false,
    sort_by: 'content.year:desc',
  };
  const publishedToken = getStoryblokAccessToken(false);
  const paramsWithCv = await withPublishedStoryblokCv(sbParams, publishedToken);

  const storyblokApi = getStoryblokApi();
  const projects = await storyblokApi.get('cdn/stories', paramsWithCv, {
    cache: 'force-cache',
    next: {
      revalidate: 3600,
      tags: [STORYBLOK_TAG_ALL, STORYBLOK_TAG_PROJECTS],
    },
  });

  const stories = (projects.data?.stories ?? []) as StoryblokProjectStory[];

  return stories.map((story) => ({
    slug: story.slug,
    year: story.content.year,
    title: story.content.title,
    category: story.content.category,
    highlight: story.content.highlight,
    thumbnail: story.content.thumbnail,
    external_link: story.content.external_link,
  }));
}
