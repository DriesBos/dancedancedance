import { ISbStoriesParams, getStoryblokApi } from '@storyblok/react/rsc';
import BlokProject from '../../BlokProject';

export default async function BlokProjectList() {
  const projects = await fetchProjects();

  const data = projects.data.stories.map((story: any) => {
    return {
      slug: story.slug,
      year: story.content.year,
      title: story.content.title,
      category: story.content.category,
      role: story.content.role,
      location: story.content.location,
      active: story.content.active,
      images: story.content.images,
    };
  });

  console.log(data, 'data');

  return (
    <>
      {data.map((item: any, index: number) => (
        <BlokProject
          key={index}
          slug={item.slug}
          year={item.year}
          title={item.title}
          category={item.category}
          role={item.role}
          location={item.location}
          active={item.active}
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
