import { ISbStoriesParams } from '@storyblok/react/rsc';
import { getStoryblokApi } from '@/lib/storyblok';

export interface ProjectData {
  slug: string;
  year: string;
  title: string;
}

export async function fetchProjectSlugs(): Promise<ProjectData[]> {
  const sbParams: ISbStoriesParams = {
    version: 'published',
    starts_with: 'projects',
    is_startpage: false,
    sort_by: 'content.year:desc', // Sort by year descending
  };

  const storyblokApi = getStoryblokApi();
  if (!storyblokApi) {
    console.warn('Storyblok API not initialized, returning empty projects');
    return [];
  }

  const response = await storyblokApi.get(`cdn/stories`, sbParams, {
    cache: 'force-cache',
    next: { revalidate: 3600 }, // Revalidate every hour
  });

  // Return projects in CMS order
  const projects = response.data.stories.map((story: any) => ({
    slug: story.slug,
    year: story.content.year || '0',
    title: story.content.title || story.name,
  }));

  return projects;
}
