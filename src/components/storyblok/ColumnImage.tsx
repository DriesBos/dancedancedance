import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import BlurImage from '@/components/BlurImage';
import ColorBurstText from '@/components/ColorBurstTypography/ColorBurstText';
import {
  parseStoryblokImageDimensions,
  STORYBLOK_FALLBACK_IMAGE_DIMENSIONS,
} from '@/lib/storyblok-image';

interface SbPageData extends SbBlokData {
  image?: {
    filename: string;
    alt: string;
    blurDataURL?: string;
  };
  caption?: string;
  side_caption?: boolean;
}

interface ColumnImageProps {
  blok: SbPageData;
  imageSizes?: string;
  imagePriority?: boolean;
}

const ColumnImage: React.FunctionComponent<ColumnImageProps> = ({
  blok,
  imageSizes = '100vw',
  imagePriority = false,
}) => {
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
      <BlurImage
        src={blok.image.filename}
        alt={blok.image.alt || blok.caption || 'Image'}
        width={imageDimensions.width}
        height={imageDimensions.height}
        sizes={imageSizes}
        className="imageItem"
        quality={70}
        // priority = eager + fetchpriority=high + <link rel=preload>; only the
        // first image of the first blok, everything else stays lazy.
        {...(imagePriority ? { priority: true } : { loading: 'lazy' })}
        blurDataURL={blok.image.blurDataURL}
        style={{ width: '100%', height: 'auto' }}
      />
      {blok.caption && (
        <div className="column-Caption">
          <ColorBurstText>{blok.caption}</ColorBurstText>
        </div>
      )}
    </div>
  );
};

export default ColumnImage;
