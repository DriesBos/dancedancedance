'use client';

import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useSwipeable } from 'react-swipeable';
import MuxPlayer from '@/components/MuxPlayer';
import SliderIndicators from '@/components/SliderIndicators';
import GrainyGradient from '@/components/GrainyGradient';
import BlokSidePanels from '@/components/BlokSidePanels';
import { storyblokImageLoader } from '@/lib/storyblok-image';
import styles from './BlokProjectSlider.module.sass';

interface SbPageData extends SbBlokData {
  body: Array<{
    _uid: string;
    name: string;
    year: string;
    video_link?: string; // Legacy: direct video URL
    mux_playback_id?: string; // New: Mux playback ID
    aspect_ratio?: string; // Custom aspect ratio from Storyblok (e.g., "16/9", "4/3", "1/1")
    media?: {
      filename: string;
      alt: string;
    };
    link?: {
      cached_url: string;
    };
    duration?: number;
  }>;
}

interface BlokProjectSliderProps {
  blok: SbPageData;
}

// Separate component for each slide item
interface SlideItemProps {
  item: SbPageData['body'][0];
  isActive: boolean;
  index: number;
}

const SlideItem = ({ item, isActive, index }: SlideItemProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const muxPlayerRef = useRef<any>(null);

  // Control video playback based on isActive state
  useEffect(() => {
    const video = videoRef.current;

    if (item.video_link && video) {
      if (isActive) {
        // Play video when active
        video.currentTime = 0; // Reset to start
        video.play().catch((err) => {
          console.warn('Video play failed:', err);
        });
      } else {
        // Pause and reset when inactive
        video.pause();
        video.currentTime = 0;
      }
    }
  }, [isActive, item.video_link]);

  // Control MuxPlayer playback
  useEffect(() => {
    const muxPlayer = muxPlayerRef.current;

    if (item.mux_playback_id && muxPlayer) {
      if (isActive) {
        muxPlayer.currentTime = 0;
        muxPlayer.play().catch((err: any) => {
          console.warn('MuxPlayer play failed:', err);
        });
      } else {
        muxPlayer.pause();
        muxPlayer.currentTime = 0;
      }
    }
  }, [isActive, item.mux_playback_id]);

  const renderMedia = () => {
    if (item.mux_playback_id) {
      return (
        <MuxPlayer
          ref={muxPlayerRef}
          playbackId={item.mux_playback_id}
          poster={item.media?.filename}
          className="muxPlayer imageItem"
          aspectRatio={item.aspect_ratio || '16 / 9'}
          dynamicAspectRatio={!item.aspect_ratio}
          noControls={true}
          muted
          playsInline
          loading={isActive ? 'page' : 'viewport'}
          preload={isActive ? 'metadata' : 'none'}
        />
      );
    } else if (item.video_link && item.media?.filename) {
      return (
        <video
          ref={videoRef}
          src={item.video_link}
          muted
          playsInline
          preload={isActive ? 'metadata' : 'none'}
          className="imageItem"
          poster={item.media?.filename}
          style={{ width: '100%', height: 'auto' }}
        />
      );
    } else if (
      item.media &&
      typeof item.media === 'object' &&
      'filename' in item.media
    ) {
      const media = item.media as { filename: string; alt?: string };

      return (
        <Image
          loader={storyblokImageLoader}
          src={media.filename}
          alt={media.alt || (item.name as string) || 'Project Image'}
          fill
          sizes="(max-width: 770px) 100vw, 100vw"
          quality={65}
          className="imageItem"
          priority={index === 0} // Only prioritize first image
          loading={index === 0 ? 'eager' : 'lazy'}
          fetchPriority={index === 0 ? 'high' : 'low'}
        />
      );
    }
    return null;
  };

  return (
    <div className={styles.item} data-active={isActive}>
      <div className={styles.image}>
        <div className={styles.imageWrapper}>{renderMedia()}</div>
      </div>
      <div className={styles.caption}>
        {/* <div className={styles.captionYear}>{item.year}</div> */}
        <div className={styles.captionTitle}>
          <span>Featured work</span>
        </div>
        <div>{String(item.name)}</div>
        {/* <span>Featured</span> */}
      </div>
    </div>
  );
};

const BlokProjectSlider = ({ blok }: BlokProjectSliderProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [hasCursor, setHasCursor] = useState(false);
  const suppressTapUntilRef = useRef(0);

  const currentItem = blok.body?.[activeIndex];
  const currentDuration = currentItem?.duration || 800;

  // Detect if device has a cursor (not mobile/tablet)
  useEffect(() => {
    // Check if the device has fine pointer capability (mouse)
    const hasFineCursor = window.matchMedia('(pointer: fine)').matches;
    setHasCursor(hasFineCursor);
  }, []);

  // Auto-advance slides (paused when hovering)
  useEffect(() => {
    if (!blok.body || blok.body.length === 0) return;

    // Don't auto-advance if user is hovering
    if (isHovering) return;

    const timeout = setTimeout(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % blok.body.length);
    }, currentDuration);

    return () => clearTimeout(timeout);
  }, [blok.body, activeIndex, currentDuration, isHovering]);

  // Handle hover zone interaction
  const handleZoneEnter = (index: number) => {
    if (!hasCursor) return;
    setIsHovering(true);
    setActiveIndex(index);
  };

  const handleZoneLeave = () => {
    if (!hasCursor) return;
    setIsHovering(false);
  };

  const swipeToPrevSlide = () => {
    if (!blok.body || blok.body.length <= 1) return;
    setActiveIndex(
      (prevIndex) => (prevIndex - 1 + blok.body.length) % blok.body.length,
    );
  };

  const swipeToNextSlide = () => {
    if (!blok.body || blok.body.length <= 1) return;
    setActiveIndex((prevIndex) => (prevIndex + 1) % blok.body.length);
  };

  const swipeHandlers = useSwipeable({
    trackTouch: true,
    trackMouse: false,
    delta: { left: 48, right: 48 },
    preventScrollOnSwipe: false,
    onSwipedLeft: () => {
      suppressTapUntilRef.current = Date.now() + 400;
      swipeToNextSlide();
    },
    onSwipedRight: () => {
      suppressTapUntilRef.current = Date.now() + 400;
      swipeToPrevSlide();
    },
  });

  const handleTapTargetClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (Date.now() >= suppressTapUntilRef.current) return;
    e.preventDefault();
    e.stopPropagation();
  };

  if (!blok.body || blok.body.length === 0 || !currentItem) return null;

  return (
    <div
      className={`blok blok-Animate blok-ProjectSlider ${styles.projectSlider}`}
      {...storyblokEditable(blok)}
      {...swipeHandlers}
    >
      <GrainyGradient variant="blok" />
      <BlokSidePanels />
      <SlideItem
        key={currentItem._uid}
        item={currentItem}
        isActive={true}
        index={activeIndex}
      />
      <div className={`${styles.indicatorAnchor} indicatorAnchor`}>
        <SliderIndicators total={blok.body.length} activeIndex={activeIndex} />
      </div>

      {!hasCursor && currentItem?.link?.cached_url && (
        <Link
          href={currentItem.link.cached_url}
          className={styles.tapTarget}
          aria-label={`Open project ${String(currentItem.name || '')}`.trim()}
          onClick={handleTapTargetClick}
        />
      )}

      {/* Invisible hover zones - only rendered on devices with cursor */}
      {hasCursor && blok.body.length > 1 && (
        <div className={styles.hoverZones} onMouseLeave={handleZoneLeave}>
          {blok.body.map((item, index) => (
            <Link
              key={`zone-${item._uid}`}
              href={item.link?.cached_url || '#'}
              className={`${styles.hoverZone} cursorInteract`}
              style={{ width: `${100 / blok.body.length}%` }}
              onMouseEnter={() => handleZoneEnter(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BlokProjectSlider;
