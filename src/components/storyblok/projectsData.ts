import { ISbStoriesParams } from '@storyblok/react/rsc';
import { getStoryblokApi } from '@/lib/storyblok';

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

export async function fetchProjectData(): Promise<ProjectData[]> {
  const sbParams: ISbStoriesParams = {
    version: 'published',
    starts_with: 'projects',
    is_startpage: false,
    sort_by: 'content.year:desc',
  };

  const storyblokApi = getStoryblokApi();
  const projects = await storyblokApi.get('cdn/stories', sbParams, {
    cache: 'no-store',
  });

  return projects.data.stories.map((story: any) => ({
    slug: story.slug,
    year: story.content.year,
    title: story.content.title,
    category: story.content.category,
    highlight: story.content.highlight,
    thumbnail: story.content.thumbnail,
    external_link: story.content.external_link,
  }));
}
