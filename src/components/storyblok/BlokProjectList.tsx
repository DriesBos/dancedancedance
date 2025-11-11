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
      role: story.content.role,
      location: story.content.location,
      active: story.content.active,
      images: story.content.images,
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
          role={item.role}
          location={item.location}
          active={item.active}
          images={item.images}
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
    cv: Date.now(), // Cache version for CDN cache busting
  };

  const storyblokApi = getStoryblokApi();
  return await storyblokApi.get(`cdn/stories`, sbParams, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });
}
