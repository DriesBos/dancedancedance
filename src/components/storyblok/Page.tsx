import {
  SbBlokData,
  storyblokEditable,
  StoryblokServerComponent,
} from '@storyblok/react/rsc';

interface SbPageData extends SbBlokData {
  body: SbBlokData[];
}

interface PageProps {
  blok: SbPageData;
}

const Page = ({ blok }: PageProps) => {
  return (
    <div className="page page-General" {...storyblokEditable(blok)}>
      {blok.body.map((nestedBlok) => (
        <StoryblokServerComponent blok={nestedBlok} key={nestedBlok._uid} />
      ))}
    </div>
  );
};

export default Page;
