import {
  ISbStoriesParams,
  SbBlokData,
  getStoryblokApi,
  storyblokEditable,
} from '@storyblok/react/rsc';
import BlokProjectListClient from '../BlokProjectListClient';
import Image from 'next/image';
import Link from 'next/link';

interface SbPageData extends SbBlokData {
  slug?: string;
  year?: string;
  title?: string;
  category?: string[];
  highlight?: boolean;
  thumbnail?: {
    filename: string;
    alt: string;
  };
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
      highlight: story.content.highlight,
      thumbnail: story.content.thumbnail,
    };
  });

  const highlights = data.filter((item: any) => item.highlight === true);

  return (
    <div className="blok blok-ProjectImagesList" {...storyblokEditable(blok)}>
      <div className="blok-Highlights">
        {highlights.map((item: any, index: number) => (
          <Link
            key={item.slug}
            className="blok blok-Highlights-Item blok-Animate"
            href={`/projects/${item.slug}`}
          >
            <div className="blok-Highlights-Item-Image">
              <Image
                src={item.thumbnail.filename}
                alt={item.title || 'Project Image'}
                width={0}
                height={0}
                sizes="100vw"
                quality={90}
                style={{ width: '100%', height: 'auto' }}
              />
            </div>
            <div className="blok-Highlights-Item-Title">{item.title}</div>
          </Link>
        ))}
      </div>
      <BlokProjectListClient data={data} />
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
    cache: 'no-store',
  });
}

export default BlokProjectImagesList;
