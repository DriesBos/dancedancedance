'use client';

import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import Image from 'next/image';
import ColorBurstText from '@/components/ColorBurstTypography/ColorBurstText';
import { useEffect, useMemo, useState } from 'react';
import {
  parseStoryblokImageDimensions,
  STORYBLOK_FALLBACK_IMAGE_DIMENSIONS,
} from '@/lib/storyblok-image';
import SliderIndicators from '../SliderIndicators';

interface SbPageData extends SbBlokData {
  images?: {
    id?: string;
    filename?: string;
    alt?: string;
    name?: string;
    blurDataURL?: string;
  }[];
  images_mobile?: {
    id?: string;
    filename?: string;
    alt?: string;
    name?: string;
    blurDataURL?: string;
  }[];
  caption?: string;
  caption_side?: boolean;
  speed?: number;
}

interface ColumnSliderProps {
  blok: SbPageData;
  imageSizes?: string;
}

const ColumnSlider: React.FunctionComponent<ColumnSliderProps> = ({
  blok,
  imageSizes = '(max-width: 770px) 100vw, 50vw',
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Determine if we should use mobile images
  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth < 770);
    };

    // Check on mount
    checkWidth();

    // Listen to resize events
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  // Select the appropriate images array based on screen width
  const activeImages = useMemo(() => {
    const sourceImages =
      isMobile && blok.images_mobile?.length ? blok.images_mobile : blok.images;

    return (
      sourceImages?.filter(
        (image): image is NonNullable<typeof image> & { filename: string } =>
          Boolean(image?.filename),
      ) ?? []
    );
  }, [blok.images, blok.images_mobile, isMobile]);
  const currentImage = activeImages[activeIndex];

  useEffect(() => {
    if (activeImages.length === 0) {
      setActiveIndex(0);
      return;
    }

    setActiveIndex((prevIndex) => prevIndex % activeImages.length);
  }, [activeImages.length]);

  useEffect(() => {
    if (activeImages.length <= 1) return;

    const timeout = window.setTimeout(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % activeImages.length);
    }, blok.speed ?? 800);

    return () => window.clearTimeout(timeout);
  }, [activeImages.length, activeIndex, blok.speed]);

  if (!currentImage?.filename) return null;

  return (
    <div
      className="column column-Slider"
      {...storyblokEditable(blok)}
      data-caption-side={blok.caption_side}
      data-caption={blok.caption ? true : false}
    >
      <div className="column-Slider-Stack">
        {activeImages.map((image, index) => {
          const isActive = index === activeIndex;
          const isNext = index === (activeIndex + 1) % activeImages.length;
          const imageDimensions =
            parseStoryblokImageDimensions(image.filename) ??
            STORYBLOK_FALLBACK_IMAGE_DIMENSIONS;
          return (
            <div
              key={image.id || image.filename || index}
              className="column-Slider-Item"
              data-active={isActive}
            >
              <div className="column-Slider-ImageWrapper">
                <Image
                  src={image.filename}
                  alt={image.alt || image.name || 'Project image'}
                  width={imageDimensions.width}
                  height={imageDimensions.height}
                  sizes={imageSizes}
                  quality={70}
                  className="imageItem"
                  loading={index === 0 || isActive || isNext ? 'eager' : 'lazy'}
                  fetchPriority={isActive ? 'high' : isNext ? 'auto' : 'low'}
                  {...(image.blurDataURL
                    ? { placeholder: 'blur' as const, blurDataURL: image.blurDataURL }
                    : {})}
                  style={{ width: '100%', height: 'auto' }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {(currentImage.name || blok.caption || activeImages.length > 1) && (
        <div className="column-Caption column-Slider-Caption">
          <div className="column-Slider-CaptionText">
            {currentImage.name && (
              <div><ColorBurstText>{currentImage.name}</ColorBurstText></div>
            )}
            {blok.caption && (
              <div><ColorBurstText>{blok.caption}</ColorBurstText></div>
            )}
          </div>
          <SliderIndicators
            total={activeImages.length}
            activeIndex={activeIndex}
          />
        </div>
      )}
    </div>
  );
};

export default ColumnSlider;
