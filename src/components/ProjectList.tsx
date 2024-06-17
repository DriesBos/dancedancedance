import { ISbStoriesParams, getStoryblokApi } from '@storyblok/react/rsc';
import BlokProject from './BlokProject';

export default async function ProjectList() {
  const projects = await fetchProjects();

  const data = projects.data.stories.map((story: any) => {
    return {
      slug: story.slug,
      year: story.content.year,
      title: story.content.title,
      active: story.content.active,
      client: story.content.agency,
      category: story.content.category,
      images: story.content.images,
    };
  });

  console.log(typeof data);

  return (
    <>
      {data.map((item: any, index: number) => (
        <BlokProject
          key={index}
          slug={item.slug}
          year={item.year}
          title={item.title}
          active={item.active}
          client={item.client}
          category={item.category}
          images={item.images}
        />
      ))}
    </>
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
