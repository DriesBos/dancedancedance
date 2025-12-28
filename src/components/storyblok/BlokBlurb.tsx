'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import Image from 'next/image';

interface Position {
  x: number;
  y: number;
}

interface SbBlurpData extends SbBlokData {
  media: {
    filename?: string;
    alt?: string;
  }[];
  caption?: string;
  tags: string[];
  hyperlink?: {
    cached_url?: string;
  };
}

interface BlokBlurbProps {
  blok: SbBlurpData;
  position: Position;
  canvasOffset: Position;
}

const BlokBlurb: React.FunctionComponent<BlokBlurbProps> = ({
  blok,
  position,
  canvasOffset,
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Generate size variation based on position (deterministic)
  const sizeVariant = useMemo(() => {
    const hash = Math.floor((position.x * 7 + position.y * 13) % 3);
    return ['small', 'medium', 'large'][hash];
  }, [position]);

  // Width classes for size variants
  const widthMap: Record<string, string> = {
    small: '12vw',
    medium: '18vw',
    large: '25vw',
  };

  // Check visibility based on canvas offset
  // Items near the viewport should be loaded
  useEffect(() => {
    if (isLoaded) return; // Already loaded, no need to check

    const checkVisibility = () => {
      if (typeof window === 'undefined') return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Item's position on canvas (in vw/vh converted to pixels)
      // The canvas is offset by top: -50vh, left: -50vw
      // So item at position 100vw, 100vh would be at center initially
      const itemPixelX = (position.x / 100) * vw;
      const itemPixelY = (position.y / 100) * vh;

      // Canvas offset from GSAP Draggable (in pixels)
      // Plus the CSS offset (-100vw + 50vw = -50vw, -100vh + 50vh = -50vh)
      const canvasBaseX = -0.5 * vw;
      const canvasBaseY = -0.5 * vh;

      // Final item position relative to viewport
      const finalX = itemPixelX + canvasBaseX + canvasOffset.x;
      const finalY = itemPixelY + canvasBaseY + canvasOffset.y;

      // Check if item is within extended viewport (with margin for preloading)
      const margin = 300; // pixels - preload items this far outside viewport
      const isInViewport =
        finalX > -margin - 500 && // item width estimate
        finalX < vw + margin &&
        finalY > -margin - 500 && // item height estimate
        finalY < vh + margin;

      if (isInViewport) {
        setIsVisible(true);
        setIsLoaded(true); // Once loaded, stay loaded
      }
    };

    checkVisibility();
  }, [canvasOffset, position, isLoaded]);

  // Initial check on mount
  useEffect(() => {
    // Small delay to ensure proper measurements
    const timer = setTimeout(() => {
      if (!isLoaded) {
        setIsVisible(true);
        setIsLoaded(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isLoaded]);

  return (
    <div
      ref={itemRef}
      className={`page-Blurbs-Item ${isVisible ? 'is-visible' : ''}`}
      style={{
        left: `${position.x}vw`,
        top: `${position.y}vh`,
        width: widthMap[sizeVariant],
        minWidth: '180px',
        maxWidth: '450px',
      }}
      data-cursor={blok.caption || 'View'}
      {...storyblokEditable(blok)}
    >
      <div className="page-Blurbs-Item-Inner">
        {isVisible &&
          blok.media &&
          blok.media.length > 0 &&
          blok.media[0].filename && (
            <div className="page-Blurbs-Item-Media">
              <Image
                src={blok.media[0].filename}
                alt={blok.media[0].alt || blok.caption || ''}
                width={0}
                height={0}
                sizes="(max-width: 768px) 50vw, 25vw"
                quality={80}
                style={{ width: '100%', height: 'auto' }}
                loading="lazy"
              />
            </div>
          )}
        {isVisible && blok.caption && (
          <div className="page-Blurbs-Item-Caption">{blok.caption}</div>
        )}
      </div>
    </div>
  );
};

export default BlokBlurb;
