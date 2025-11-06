import styles from './PageProject.module.sass';

import {
  SbBlokData,
  storyblokEditable,
  StoryblokServerComponent,
} from '@storyblok/react/rsc';

interface SbPageProjectData extends SbBlokData {
  body: SbBlokData[];
}

interface ProjectProps {
  blok: SbPageProjectData;
}

const PageProject = ({ blok }: ProjectProps) => {
  return (
    <div className="Page page-Project" {...storyblokEditable(blok)}>
      {blok.body.map((nestedBlok: any) => (
        <StoryblokServerComponent blok={nestedBlok} key={nestedBlok._uid} />
      ))}
    </div>
  );
};

export default PageProject;
