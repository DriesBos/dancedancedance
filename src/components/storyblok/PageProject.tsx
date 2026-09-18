import {
  SbBlokData,
  storyblokEditable,
  StoryblokServerComponent,
} from '@storyblok/react/rsc';
import { findFirstImageBlok } from './Page';

interface SbPageProjectData extends SbBlokData {
  body: SbBlokData[];
  title?: string;
}

interface ProjectProps {
  blok: SbPageProjectData;
}

const PageProject = ({ blok }: ProjectProps) => {
  const firstImageBlok = findFirstImageBlok(blok.body);
  return (
    <article className="page page-Project" {...storyblokEditable(blok)}>
      {blok.body.map((nestedBlok, index) => (
        <StoryblokServerComponent
          blok={nestedBlok}
          key={nestedBlok._uid}
          stackIndex={blok.body.length - index}
          imagePriority={index === firstImageBlok}
        />
      ))}
    </article>
  );
};

export default PageProject;
