import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import Image from 'next/image';

interface SbPageData extends SbBlokData {
  image?: {
    filename: string;
    alt: string;
  };
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
        style={{ width: '100%', height: 'auto' }}
      />
    </div>
  );
};

export default ColumnImage;
