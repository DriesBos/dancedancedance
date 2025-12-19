'use client';

import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface SbPageData extends SbBlokData {
  images?: {
    id?: string;
    filename?: string;
    alt?: string;
    name?: string;
  }[];
  caption?: string;
}

interface ColumnSliderProps {
  blok: SbPageData;
}

const ColumnSlider: React.FunctionComponent<ColumnSliderProps> = ({ blok }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  // Get current and next items for conditional rendering
  const currentImage = blok.images?.[activeIndex];
  const nextIndex = blok.images ? (activeIndex + 1) % blok.images.length : 0;
  const nextImage = blok.images?.[nextIndex];

  // Fade in animation on slide change
  useGSAP(() => {
    if (!itemRef.current) return;

    gsap.fromTo(
      itemRef.current,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0,
        ease: 'linear',
      }
    );
  }, [activeIndex]);

  useEffect(() => {
    if (!blok.images || blok.images.length === 0) return;

    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % blok.images!.length);
    }, 800);

    return () => clearInterval(interval);
  }, [blok.images]);

  if (!currentImage) return null;

  return (
    <div className="column column-Slider" {...storyblokEditable(blok)}>
      {/* Current slide */}
      <div ref={itemRef} className="column-Slider-Item">
        <Image
          src={currentImage.filename}
          alt={currentImage.alt}
          width={0}
          height={0}
          sizes="100vw"
          quality={80}
          priority
          style={{ width: '100%', height: 'auto' }}
        />
        {currentImage.name && (
          <div className="column-Caption">{currentImage.name}</div>
        )}
        {blok.caption && <div className="column-Caption">{blok.caption}</div>}
      </div>

      {/* Preload next image (hidden, but loads in background) */}
      {nextImage && (
        <div style={{ display: 'none' }}>
          <Image
            src={nextImage.filename}
            alt={nextImage.alt}
            width={0}
            height={0}
            sizes="100vw"
            quality={80}
            priority
            style={{ width: '100%', height: 'auto' }}
          />
        </div>
      )}
    </div>
  );
};

export default ColumnSlider;
