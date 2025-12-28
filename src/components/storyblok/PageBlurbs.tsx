import {
  SbBlokData,
  storyblokEditable,
  StoryblokServerComponent,
} from '@storyblok/react/rsc';

interface SbPageBlurbsData extends SbBlokData {
  body: SbBlokData[];
}

interface PageBlurbsProps {
  blok: SbPageBlurbsData;
}

const PageBlurbs = ({ blok }: PageBlurbsProps) => {
  console.log(blok.body);
  return (
    <div className="page page-Blurbs" {...storyblokEditable(blok)}>
      {blok.body.map((nestedBlok: any) => (
        <StoryblokServerComponent blok={nestedBlok} key={nestedBlok._uid} />
      ))}
    </div>
  );
};

export default PageBlurbs;
