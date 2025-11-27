import { ISbStoriesParams, getStoryblokApi } from '@storyblok/react/rsc';

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
  };

  const storyblokApi = getStoryblokApi();
  const response = await storyblokApi.get(`cdn/stories`, sbParams, {
    cache: 'force-cache',
    next: { revalidate: 3600 }, // Revalidate every hour
  });

  // Sort by year descending and return slugs
  const projects = response.data.stories
    .map((story: any) => ({
      slug: story.slug,
      year: story.content.year || '0',
      title: story.content.title || story.name,
    }))
    .sort(
      (a: ProjectData, b: ProjectData) => parseInt(b.year) - parseInt(a.year)
    );

  return projects;
}
