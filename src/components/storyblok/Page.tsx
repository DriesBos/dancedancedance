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

// Index of the first blok holding a Column Image: its image is the LCP candidate.
export const findFirstImageBlok = (body: SbBlokData[]) =>
  body.findIndex((b) =>
    (b.body as SbBlokData[] | undefined)?.some((c) => c.component === 'Column Image'),
  );

const Page = ({ blok }: PageProps) => {
  const firstImageBlok = findFirstImageBlok(blok.body);
  return (
    <div className="page page-General" {...storyblokEditable(blok)}>
      {blok.body.map((nestedBlok, index) => (
        <StoryblokServerComponent
          blok={nestedBlok}
          key={nestedBlok._uid}
          stackIndex={blok.body.length - index}
          imagePriority={index === firstImageBlok}
        />
      ))}
    </div>
  );
};

export default Page;
