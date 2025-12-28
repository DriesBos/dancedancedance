'use client';

import { useRef, useState, useEffect } from 'react';
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
  index: number; // Item index for consistent sizing
}

// Same seeded random as in PageBlurbs for consistency
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// Size variants matching the positioning algorithm
// parallaxFactor < 1 means slower movement (appears further away)
const SIZE_VARIANTS = [
  { name: 'small', width: '16vw', parallaxFactor: 0.95 },
  { name: 'medium', width: '18vw', parallaxFactor: 1 },
  { name: 'large', width: '20vw', parallaxFactor: 1.05 },
] as const;

const BlokBlurb: React.FunctionComponent<BlokBlurbProps> = ({
  blok,
  position,
  canvasOffset,
  index,
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Get size variant using same algorithm as positioning
  const variantIndex = Math.floor(seededRandom(index * 777) * 3);
  const sizeVariant = SIZE_VARIANTS[variantIndex];

  // Calculate parallax counter-offset for depth effect
  // Small items move slower (parallaxFactor < 1), so we counter-offset them
  const parallaxOffset = {
    x: canvasOffset.x * (1 - sizeVariant.parallaxFactor),
    y: canvasOffset.y * (1 - sizeVariant.parallaxFactor),
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

  // Parallax transform (instant - no transition)
  const parallaxTransform = `translate(${-parallaxOffset.x}px, ${-parallaxOffset.y}px)`;

  return (
    // Outer wrapper: position + parallax (instant, no transition)
    <div
      ref={itemRef}
      className="page-Blurbs-Item-Wrapper"
      style={{
        position: 'absolute',
        left: `${position.x}vw`,
        top: `${position.y}vh`,
        width: sizeVariant.width,
        minWidth: '180px',
        maxWidth: '450px',
        transform: parallaxTransform,
      }}
      {...storyblokEditable(blok)}
    >
      {/* Inner element: visibility animation (with transition) */}
      <div
        className={`page-Blurbs-Item ${isVisible ? 'is-visible' : ''}`}
        data-cursor={blok.caption || 'View'}
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
    </div>
  );
};

export default BlokBlurb;
