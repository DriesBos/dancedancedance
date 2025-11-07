'use client';

import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import Link from 'next/link';

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

  useEffect(() => {
    if (!blok.body || blok.body.length === 0) return;

    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % blok.body.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [blok.body]);

  return (
    <div className="blok blok-ProjectSlider" {...storyblokEditable(blok)}>
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
                  width={600}
                  height={400}
                  style={{ width: '100%', height: 'auto' }}
                />
              )}
          </div>
          <div className="blok-ProjectSlider-Title">{String(item.name)}</div>
        </Link>
      ))}
    </div>
  );
};

export default BlokProjectSlider;
