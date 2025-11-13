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

  // Animate progress bar in sync with slide changes
  useGSAP(() => {
    if (!progressRef.current) return;

    // Reset to 0 and animate to 100%
    gsap.fromTo(
      progressRef.current,
      { width: '0%' },
      {
        width: '100%',
        duration: 1.8,
        ease: 'linear',
      }
    );
  }, [activeIndex]); // Re-run when activeIndex changes

  useEffect(() => {
    if (!blok.body || blok.body.length === 0) return;

    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % blok.body.length);
    }, 1800);

    return () => clearInterval(interval);
  }, [blok.body]);

  return (
    <div
      className="blok blok-ProjectSlider blok-Animate"
      {...storyblokEditable(blok)}
    >
      {blok.body.map((item, index) => (
        <Link
          key={item._uid}
          className="blok-ProjectSlider-Item"
          data-active={index === activeIndex}
          href={item.link?.cached_url || '#'}
        >
          <div className="blok-ProjectSlider-Image">
            {item.media &&
              typeof item.media === 'object' &&
              'filename' in item.media && (
                <Image
                  src={(item.media as any).filename}
                  alt={(item.name as string) || 'Project Image'}
                  width={0}
                  height={0}
                  sizes="100vw"
                  quality={90}
                  priority={index === 0 || index === 1}
                  style={{ width: '100%', height: 'auto' }}
                />
              )}
          </div>
          <div className="blok-ProjectSlider-Title">
            <span>{String(item.name)}</span>
            {index === activeIndex && (
              <div className="blok-ProjectSlider-ProgressWrapper">
                <div
                  className="blok-ProjectSlider-Progress"
                  ref={progressRef}
                />
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
};

export default BlokProjectSlider;
