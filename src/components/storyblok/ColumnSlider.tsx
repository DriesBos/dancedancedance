'use client';

import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  storyblokImageLoader,
  transformStoryblokImageUrl,
} from '@/lib/storyblok-image';
import SliderIndicators from '../SliderIndicators';

interface SbPageData extends SbBlokData {
  images?: {
    id?: string;
    filename?: string;
    alt?: string;
    name?: string;
  }[];
  images_mobile?: {
    id?: string;
    filename?: string;
    alt?: string;
    name?: string;
  }[];
  caption?: string;
  caption_side?: boolean;
  speed?: number;
}

interface ColumnSliderProps {
  blok: SbPageData;
}

const warmedColumnSliderImageSrcs = new Set<string>();

const ColumnSlider: React.FunctionComponent<ColumnSliderProps> = ({ blok }) => {
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
  const activeImages = (
    isMobile && blok.images_mobile?.length ? blok.images_mobile : blok.images
  )?.filter((image): image is NonNullable<typeof image> & { filename: string } =>
    Boolean(image?.filename),
  ) ?? [];
  const currentImage = activeImages[activeIndex];
  const nextImage =
    activeImages.length > 1
      ? activeImages[(activeIndex + 1) % activeImages.length]
      : null;

  useEffect(() => {
    if (activeImages.length === 0) {
      setActiveIndex(0);
      return;
    }

    setActiveIndex((prevIndex) => prevIndex % activeImages.length);
  }, [activeImages.length]);

  useEffect(() => {
    if (!nextImage?.filename) return;

    const warmSrc = transformStoryblokImageUrl(nextImage.filename, {
      width: 1600,
      quality: 70,
      noUpscale: true,
    });

    if (!warmSrc || warmedColumnSliderImageSrcs.has(warmSrc)) return;

    warmedColumnSliderImageSrcs.add(warmSrc);
    const image = new window.Image();
    if ('fetchPriority' in image) {
      (image as HTMLImageElement & { fetchPriority?: 'high' | 'low' | 'auto' })
        .fetchPriority = 'high';
    }
    image.decoding = 'async';
    image.src = warmSrc;
    image.decode?.().catch(() => {});
  }, [nextImage?.filename]);

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

          return (
            <div
              key={image.id || image.filename || index}
              className="column-Slider-Item"
              data-active={isActive}
            >
              <div className="column-Slider-ImageWrapper">
                <Image
                  loader={storyblokImageLoader}
                  src={image.filename}
                  alt={image.alt || image.name || 'Project image'}
                  width={0}
                  height={0}
                  sizes="(max-width: 770px) 100vw, 50vw"
                  quality={70}
                  className="imageItem"
                  priority={index === 0}
                  loading={index === 0 || isActive || isNext ? 'eager' : 'lazy'}
                  fetchPriority={
                    index === 0 || isActive || isNext ? 'high' : 'low'
                  }
                  style={{ width: '100%', height: 'auto' }}
                />
                <SliderIndicators
                  total={activeImages.length}
                  activeIndex={activeIndex}
                />
              </div>
              {image.name && <div className="column-Caption">{image.name}</div>}
            </div>
          );
        })}
      </div>
      {blok.caption && <div className="column-Caption">{blok.caption}</div>}
    </div>
  );
};

export default ColumnSlider;
