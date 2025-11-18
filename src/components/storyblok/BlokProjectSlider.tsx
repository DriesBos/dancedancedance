'use client';

import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface SbPageData extends SbBlokData {
  body: Array<{
    _uid: string;
    name: string;
    year: string;
    media?: {
      filename: string;
      alt: string;
    };
    link?: {
      cached_url: string;
    };
  }>;
}

interface BlokProjectSliderProps {
  blok: SbPageData;
}

const BlokProjectSlider = ({ blok }: BlokProjectSliderProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLAnchorElement>(null);

  // Get current and next items for conditional rendering
  const currentItem = blok.body?.[activeIndex];
  const nextIndex = blok.body ? (activeIndex + 1) % blok.body.length : 0;
  const nextItem = blok.body?.[nextIndex];

  // Animate progress bar in sync with slide changes
  useGSAP(() => {
    if (!progressRef.current) return;

    // Reset to 0 and animate to 100%
    gsap.fromTo(
      progressRef.current,
      { width: '0%' },
      {
        width: '100%',
        duration: 0.8,
        ease: 'power1.out',
      }
    );
  }, [activeIndex]); // Re-run when activeIndex changes

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
    if (!blok.body || blok.body.length === 0) return;

    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % blok.body.length);
    }, 800);

    return () => clearInterval(interval);
  }, [blok.body]);

  if (!currentItem) return null;

  return (
    <div
      className="blok blok-ProjectSlider blok-Animate"
      {...storyblokEditable(blok)}
    >
      {/* Current slide */}
      <Link
        ref={itemRef}
        className="blok-ProjectSlider-Item"
        href={currentItem.link?.cached_url || '#'}
      >
        <div className="blok-ProjectSlider-Image">
          {currentItem.media &&
            typeof currentItem.media === 'object' &&
            'filename' in currentItem.media && (
              <Image
                src={(currentItem.media as any).filename}
                alt={(currentItem.name as string) || 'Project Image'}
                width={0}
                height={0}
                sizes="100vw"
                quality={85}
                priority
                style={{ width: '100%', height: 'auto' }}
              />
            )}
        </div>
        <div className="blok-ProjectSlider-Caption">
          <div className="blok-ProjectSlider-Caption-Title">
            <span>Featured</span>
            <div className="blok-ProjectSlider-ProgressWrapper">
              <div className="blok-ProjectSlider-Progress" ref={progressRef} />
            </div>
            {String(currentItem.name)}
          </div>
          <div className="blok-ProjectSlider-Caption-Year">
            {currentItem.year}
          </div>
        </div>
      </Link>

      {/* Preload next image (hidden, but loads in background) */}
      {nextItem &&
        nextItem.media &&
        typeof nextItem.media === 'object' &&
        'filename' in nextItem.media && (
          <div style={{ display: 'none' }}>
            <Image
              src={(nextItem.media as any).filename}
              alt={(nextItem.name as string) || 'Project Image'}
              width={0}
              height={0}
              sizes="100vw"
              quality={85}
              priority
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
        )}
    </div>
  );
};

export default BlokProjectSlider;
