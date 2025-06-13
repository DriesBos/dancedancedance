import {
  SbBlokData,
  storyblokEditable,
  StoryblokServerComponent,
} from '@storyblok/react/rsc';

interface SbPageData extends SbBlokData {
  body: SbBlokData[];
}

interface ProjectProps {
  blok: SbPageData;
}

const Project = ({ blok }: ProjectProps) => {
  return (
    <div {...storyblokEditable(blok)}>
      {blok.body.map((nestedBlok: any) => (
        <StoryblokServerComponent blok={nestedBlok} key={nestedBlok._uid} />
      ))}
    </div>
  );
};

export default Project;
