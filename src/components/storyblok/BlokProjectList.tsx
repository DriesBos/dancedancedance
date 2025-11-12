import { ISbStoriesParams, getStoryblokApi } from '@storyblok/react/rsc';
import BlokProject from '../BlokProject';

export default async function BlokProjectList() {
  const projects = await fetchProjects();

  const data = projects.data.stories.map((story: any) => {
    return {
      slug: story.slug,
      year: story.content.year,
      title: story.content.title,
      category: story.content.category,
    };
  });

  return (
    <div className="blok blok-ProjectList">
      {data.map((item: any, index: number) => (
        <BlokProject
          key={index}
          slug={item.slug}
          year={item.year}
          title={item.title}
          category={item.category}
        />
      ))}
    </div>
  );
}

export async function fetchProjects() {
  let sbParams: ISbStoriesParams = {
    version: 'published',
    starts_with: 'projects',
    is_startpage: false,
  };

  const storyblokApi = getStoryblokApi();
  return await storyblokApi.get(`cdn/stories`, sbParams, {
    cache: 'no-store',
  });
}
