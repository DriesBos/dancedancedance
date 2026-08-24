import {
  SbBlokData,
  storyblokEditable,
  StoryblokServerComponent,
} from '@storyblok/react/rsc';

interface SbPageProjectData extends SbBlokData {
  body: SbBlokData[];
  title?: string;
}

interface ProjectProps {
  blok: SbPageProjectData;
}

const PageProject = ({ blok }: ProjectProps) => {
  return (
    <article className="page page-Project" {...storyblokEditable(blok)}>
      {blok.body.map((nestedBlok, index) => (
        <StoryblokServerComponent
          blok={nestedBlok}
          key={nestedBlok._uid}
          stackIndex={blok.body.length - index}
        />
      ))}
    </article>
  );
};

export default PageProject;
