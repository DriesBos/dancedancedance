import styles from './PageProject.module.sass';

import {
  SbBlokData,
  storyblokEditable,
  StoryblokServerComponent,
} from '@storyblok/react/rsc';
import Image from 'next/image';

interface SbPageProjectData extends SbBlokData {
  body: SbBlokData[];
  thumbnail?: {
    filename: string;
    alt?: string;
  };
  title?: string;
}

interface ProjectProps {
  blok: SbPageProjectData;
}

const PageProject = ({ blok }: ProjectProps) => {
  console.log('PageProject', blok.thumbnail);

  return (
    <div className="page page-Project" {...storyblokEditable(blok)}>
      {}
      <div className="blok page-Project-Thumbnail">
        {blok.thumbnail && (
          <Image
            src={blok.thumbnail.filename}
            alt={blok.title || 'Project Thumbnail'}
            width={600}
            height={400}
            style={{ width: '100%', height: 'auto' }}
          />
        )}
      </div>
      {blok.body.map((nestedBlok: any) => (
        <StoryblokServerComponent blok={nestedBlok} key={nestedBlok._uid} />
      ))}
    </div>
  );
};

export default PageProject;
