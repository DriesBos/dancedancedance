import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import Image from 'next/image';

interface SbPageData extends SbBlokData {
  image?: {
    filename: string;
    alt: string;
  };
}

interface ColumnSliderProps {
  blok: SbPageData;
}

const ColumnSlider: React.FunctionComponent<ColumnSliderProps> = ({ blok }) => {
  return (
    <div className="column column-Slider" {...storyblokEditable(blok)}>
      <Image
        src={blok.image.filename}
        alt={blok.image.alt}
        width={0}
        height={0}
        sizes="100vw"
        quality={90}
        style={{ width: '100%', height: 'auto' }}
      />
    </div>
  );
};

export default ColumnSlider;
