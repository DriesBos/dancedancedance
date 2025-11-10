import styles from './PageProject.module.sass';

import {
  SbBlokData,
  storyblokEditable,
  StoryblokServerComponent,
} from '@storyblok/react/rsc';
import Image from 'next/image';

interface SbPageProjectData extends SbBlokData {
  body: SbBlokData[];
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
      {blok.body.map((nestedBlok: any) => (
        <StoryblokServerComponent blok={nestedBlok} key={nestedBlok._uid} />
      ))}
    </div>
  );
};

export default PageProject;
