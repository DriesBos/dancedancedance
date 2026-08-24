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
      {blok.body.map((nestedBlok, index) => (
        <StoryblokServerComponent
          blok={nestedBlok}
          key={nestedBlok._uid}
          stackIndex={blok.body.length - index}
        />
      ))}
    </div>
  );
};

export default Page;
