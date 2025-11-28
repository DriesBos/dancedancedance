import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import Image from 'next/image';

interface SbPageData extends SbBlokData {
  image?: {
    filename: string;
    alt: string;
  };
  caption?: string;
}

interface ColumnImageProps {
  blok: SbPageData;
}

const ColumnImage: React.FunctionComponent<ColumnImageProps> = ({ blok }) => {
  return (
    <div className="column column-Image" {...storyblokEditable(blok)}>
      <Image
        src={blok.image.filename}
        alt={blok.image.alt}
        width={0}
        height={0}
        sizes="100vw"
        quality={80}
        style={{ width: '100%', height: 'auto' }}
      />
      {blok.caption && <span className="column-Caption">{blok.caption}</span>}
    </div>
  );
};

export default ColumnImage;
