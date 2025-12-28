import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import Image from 'next/image';

interface SbPageData extends SbBlokData {
  media: {
    filename?: string;
    alt?: string;
  }[];
  caption?: string;
  tags: string[];
  hyperlink?: {
    cached_url?: string;
  };
}

interface BlokBlurbProps {
  blok: SbPageData;
}

const BlokBlurb: React.FunctionComponent<BlokBlurbProps> = ({ blok }) => {
  return (
    <div className="blok blok-Blurb" {...storyblokEditable(blok)}>
      {blok.media.map((media) => (
        <Image
          src={media.filename}
          alt={media.alt}
          width={0}
          height={0}
          sizes="100vw"
          quality={80}
        />
      ))}
      {blok.caption && <div className="blok-Blurb-Caption">{blok.caption}</div>}
    </div>
  );
};

export default BlokBlurb;
