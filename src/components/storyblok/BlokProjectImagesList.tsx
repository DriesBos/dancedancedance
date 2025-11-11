import {
  ISbStoriesParams,
  SbBlokData,
  getStoryblokApi,
  storyblokEditable,
} from '@storyblok/react/rsc';
import BlokProject from '../BlokProject';
import Image from 'next/image';
import Link from 'next/link';

interface SbPageData extends SbBlokData {
  images: number;
}

interface BlokProjectImagesListProps {
  blok: SbPageData;
}
const BlokProjectImagesList = async ({ blok }: BlokProjectImagesListProps) => {
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

  const firstSix = data.slice(0, 4);
  const remaining = data.slice(4);

  return (
    <div className="blok blok-ProjectImagesList" {...storyblokEditable(blok)}>
      <div className="blok-ProjectImages">
        {firstSix.map((item: any, index: number) => (
          <Link
            className="blok blok-ProjectImages-Item blok-Animate"
            key={index}
            href={`/projects/${item.slug}`}
          >
            <div className="blok-ProjectImages-Item-Image">
              <Image
                src={item.images[0].filename}
                alt={item.title || 'Project Image'}
                width={600}
                height={400}
                style={{ width: '100%', height: 'auto' }}
              />
            </div>
            <div className="blok-ProjectImages-Item-Title">{item.title}</div>
          </Link>
        ))}
      </div>
      <div className="blok-ProjectList">
        {remaining.map((item: any, index: number) => (
          <BlokProject
            key={index + 4}
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
    </div>
  );
};

export async function fetchProjects() {
  let sbParams: ISbStoriesParams = {
    version: 'published',
    starts_with: 'projects',
    is_startpage: false,
  };

  const storyblokApi = getStoryblokApi();
  return await storyblokApi.get(`cdn/stories`, sbParams, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });
}

export default BlokProjectImagesList;
