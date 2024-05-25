import { ISbStoriesParams, getStoryblokApi } from '@storyblok/react/rsc';
import BlokProject from './BlokProject';

export default async function ProjectList() {
  const projects = await fetchProjects();

  const data = projects.data.stories.map((story: any) => {
    return {
      slug: story.slug,
      year: story.content.year,
      title: story.content.title,
      client: story.content.client,
      category: story.content.category,
    };
  });

  return (
    <>
      {data.map((item: any, index: number) => (
        <BlokProject
          key={index}
          slug={item.slug}
          year={item.year}
          title={item.title}
          client={item.client}
          category={item.category}
        />
      ))}
      <BlokProject
        year={'year'}
        title={'title'}
        client={'client'}
        category={'category'}
      />
    </>
  );
}

export async function fetchProjects() {
  let sbParams: ISbStoriesParams = {
    version: 'draft',
    starts_with: 'projects',
    is_startpage: false,
  };

  const storyblokApi = getStoryblokApi();
  return await storyblokApi.get(`cdn/stories`, sbParams, {
    cache: 'no-store',
  });
}
