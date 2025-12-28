import {
  SbBlokData,
  storyblokEditable,
  StoryblokServerComponent,
} from '@storyblok/react/rsc';

interface SbPageBlurbData extends SbBlokData {
  body: SbBlokData[];
}

interface ProjectProps {
  blok: SbPageBlurbData;
}

const PageBlurb = ({ blok }: ProjectProps) => {
  return (
    <div className="page page-Blurb" {...storyblokEditable(blok)}>
      {}
      {blok.body.map((nestedBlok: any) => (
        <StoryblokServerComponent blok={nestedBlok} key={nestedBlok._uid} />
      ))}
    </div>
  );
};

export default PageBlurb;
