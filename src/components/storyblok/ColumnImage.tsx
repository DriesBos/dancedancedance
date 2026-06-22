import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import Image from 'next/image';
import {
  parseStoryblokImageDimensions,
  STORYBLOK_FALLBACK_IMAGE_DIMENSIONS,
  storyblokImageLoader,
} from '@/lib/storyblok-image';

interface SbPageData extends SbBlokData {
  image?: {
    filename: string;
    alt: string;
  };
  caption?: string;
  side_caption?: boolean;
}

interface ColumnImageProps {
  blok: SbPageData;
}

const ColumnImage: React.FunctionComponent<ColumnImageProps> = ({ blok }) => {
  if (!blok.image?.filename) return null;
  const imageDimensions =
    parseStoryblokImageDimensions(blok.image.filename) ??
    STORYBLOK_FALLBACK_IMAGE_DIMENSIONS;

  return (
    <div
      className="column column-Image"
      {...storyblokEditable(blok)}
      data-caption-side={blok.side_caption}
      data-caption={blok.caption ? true : false}
    >
      <Image
        loader={storyblokImageLoader}
        src={blok.image.filename}
        alt={blok.image.alt || blok.caption || 'Image'}
        width={imageDimensions.width}
        height={imageDimensions.height}
        sizes="(max-width: 770px) 100vw, 50vw"
        className="imageItem"
        quality={70}
        loading="lazy"
        style={{ width: '100%', height: 'auto' }}
      />
      {blok.caption && <div className="column-Caption">{blok.caption}</div>}
    </div>
  );
};

export default ColumnImage;
