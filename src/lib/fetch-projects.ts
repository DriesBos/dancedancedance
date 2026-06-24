import type { ISbStoriesParams } from '@storyblok/react/rsc';
import { STORYBLOK_TAG_PROJECTS } from '@/lib/storyblok-cache';
import { fetchPublishedStoryList } from '@/lib/storyblok-stories';

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

export type ProjectSlugData = Pick<ProjectData, 'slug' | 'external_link'>;

type StoryblokProjectStory = {
  slug: string;
  name: string;
  content: {
    year?: string;
    title?: string;
    category?: string[];
    highlight?: boolean;
    thumbnail_new?: ProjectData['thumbnail'];
    thumbnail?: ProjectData['thumbnail'];
    external_link?: ProjectData['external_link'];
  };
};

const getPreferredThumbnail = (content: StoryblokProjectStory['content']) =>
  content.thumbnail_new?.filename ? content.thumbnail_new : content.thumbnail;

export async function fetchProjectData(): Promise<ProjectData[]> {
  const sbParams: ISbStoriesParams = {
    starts_with: 'projects',
    sort_by: 'content.year:desc',
  };
  const stories = await fetchPublishedStoryList<StoryblokProjectStory>(sbParams, {
    tags: [STORYBLOK_TAG_PROJECTS],
  });

  return stories.map((story) => ({
    slug: story.slug,
    year: story.content.year,
    title: story.content.title || story.name,
    category: story.content.category,
    highlight: story.content.highlight,
    thumbnail: getPreferredThumbnail(story.content),
    external_link: story.content.external_link,
  }));
}

export async function fetchProjectSlugs(): Promise<ProjectSlugData[]> {
  const projects = await fetchProjectData();

  return projects.map(({ slug, external_link }) => ({
    slug,
    external_link,
  }));
}
