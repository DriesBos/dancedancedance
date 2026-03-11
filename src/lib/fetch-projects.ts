import { ISbStoriesParams } from '@storyblok/react/rsc';
import { getStoryblokAccessToken, getStoryblokApi } from '@/lib/storyblok';
import { STORYBLOK_TAG_ALL, STORYBLOK_TAG_PROJECTS } from '@/lib/storyblok-cache';
import { withPublishedStoryblokCv } from '@/lib/storyblok-cv';

export interface ProjectData {
  slug: string;
  year: string;
  title: string;
  external_link?: { cached_url: string };
}

export async function fetchProjectSlugs(): Promise<ProjectData[]> {
  const sbParams: ISbStoriesParams = {
    version: 'published',
    starts_with: 'projects',
    is_startpage: false,
    sort_by: 'content.year:desc', // Sort by year descending
  };
  const publishedToken = getStoryblokAccessToken(false);
  const paramsWithCv = await withPublishedStoryblokCv(sbParams, publishedToken);

  const storyblokApi = getStoryblokApi();
  if (!storyblokApi) {
    console.warn('Storyblok API not initialized, returning empty projects');
    return [];
  }

  const response = await storyblokApi.get(`cdn/stories`, paramsWithCv, {
    cache: 'force-cache',
    next: {
      revalidate: 3600, // Revalidate every hour
      tags: [STORYBLOK_TAG_ALL, STORYBLOK_TAG_PROJECTS],
    },
  });

  // Return projects in CMS order
  const projects = response.data.stories.map((story: any) => ({
    slug: story.slug,
    year: story.content.year || '0',
    title: story.content.title || story.name,
    external_link: story.content.external_link,
  }));

  return projects;
}
