'use client';

import Image, { ImageProps } from 'next/image';

type BlurImageProps = Omit<ImageProps, 'placeholder' | 'blurDataURL'> & {
  blurDataURL?: string;
};

const markLoaded = (img: HTMLImageElement) => img.setAttribute('data-loaded', '');

// Crossfades the full image over its blur placeholder instead of next/image's hard swap.
const BlurImage: React.FunctionComponent<BlurImageProps> = ({ blurDataURL, className, ...props }) => (
  <span
    className="blurImage"
    style={blurDataURL ? { backgroundImage: `url(${blurDataURL})` } : undefined}
  >
    <Image
      {...props}
      className={className}
      placeholder="empty"
      // next/image's onLoad is unreliable for images that finish before hydration; listen natively.
      ref={(img) => {
        if (!img) return;
        if (img.complete) markLoaded(img);
        else img.addEventListener('load', () => markLoaded(img), { once: true });
      }}
    />
  </span>
);

export default BlurImage;
