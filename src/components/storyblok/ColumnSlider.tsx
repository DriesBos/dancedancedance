'use client';

import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
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

const ColumnSlider: React.FunctionComponent<ColumnSliderProps> = ({ blok }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);

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
  const activeImages =
    isMobile && blok.images_mobile?.length ? blok.images_mobile : blok.images;

  // Get current item for rendering
  const currentImage = activeImages?.[activeIndex];

  // Fade in animation on slide change
  useGSAP(
    () => {
      if (!itemRef.current) return;

      gsap.fromTo(
        itemRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0,
          ease: 'linear',
        },
      );
    },
    { dependencies: [activeIndex], revertOnUpdate: true },
  );

  useEffect(() => {
    if (!activeImages || activeImages.length === 0) return;

    const interval = setInterval(
      () => {
        setActiveIndex((prevIndex) => (prevIndex + 1) % activeImages.length);
      },
      blok.speed ? blok.speed : 800,
    );

    return () => clearInterval(interval);
  }, [activeImages, blok.speed]);

  if (!currentImage) return null;

  return (
    <div className="column column-Slider" {...storyblokEditable(blok)}>
      {/* Current slide */}
      <div ref={itemRef} className="column-Slider-Item">
        <div className="column-Slider-ImageWrapper">
          <Image
            src={currentImage.filename}
            alt={currentImage.alt}
            width={0}
            height={0}
            sizes="100vw"
            quality={80}
            className="imageItem"
            priority={activeIndex === 0}
            loading={activeIndex === 0 ? 'eager' : 'lazy'}
            style={{ width: '100%', height: 'auto' }}
          />
          <SliderIndicators
            total={activeImages?.length || 0}
            activeIndex={activeIndex}
          />
        </div>
        {currentImage.name && (
          <div className="column-Caption">{currentImage.name}</div>
        )}
        {blok.caption && <div className="column-Caption">{blok.caption}</div>}
      </div>
    </div>
  );
};

export default ColumnSlider;
