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
  externalLink?: string;
}

interface BlokProjectImagesListProps {
  blok: SbPageData;
}
const BlokProjectImagesList = async ({ blok }: BlokProjectImagesListProps) => {
  const projects = await fetchProjects();

  console.log('Fetched projects:', projects);

  const data = projects.data.stories.map((story: any) => {
    return {
      slug: story.slug,
      year: story.content.year,
      title: story.content.title,
      category: story.content.category,
      highlight: story.content.highlight,
      thumbnail: story.content.thumbnail,
      external_link: story.content.external_link,
    };
  });

  console.log('Fetched project data:', data);

  const dataFilteredByYear = [...data].sort((a: any, b: any) => {
    return parseInt(b.year) - parseInt(a.year);
  });

  const highlights = data
    .filter((item: any) => item.highlight === true)
    .sort((a: any, b: any) => {
      return parseInt(b.year) - parseInt(a.year);
    });

  return (
    <div className="blok blok-ProjectImagesList" {...storyblokEditable(blok)}>
      <div className="blok-Highlights">
        {highlights.map((item: any) => (
          <Link
            key={item.slug}
            className="blok blok-Highlights-Item blok-Animate"
            href={`/projects/${item.slug}`}
          >
            <div className="blok-Highlights-Item-Image cursorInteract">
              <Image
                src={item.thumbnail.filename}
                alt={item.title || 'Project Image'}
                width={0}
                height={0}
                sizes="50vw"
                quality={80}
                style={{ width: '100%', height: 'auto' }}
              />
            </div>
            <div className="blok-Highlights-Item-Caption cursorInteract">
              <div className="blok-Highlights-Item-Title">{item.title}</div>
              <div className="blok-Highlights-Item-Year">{item.year}</div>
            </div>
          </Link>
        ))}
      </div>
      <BlokProjectListClient data={dataFilteredByYear} />
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
