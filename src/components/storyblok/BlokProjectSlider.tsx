'use client';

import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { gsap, useGSAP } from '@/lib/gsap';
import MuxPlayer from '../MuxPlayer';
import SliderIndicators from '../SliderIndicators';

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
  progressRef?: React.RefObject<HTMLDivElement>;
}

const SlideItem = ({ item, isActive, index, progressRef }: SlideItemProps) => {
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
          className="muxPlayer"
          aspectRatio={item.aspect_ratio || '16 / 9'}
          dynamicAspectRatio={!item.aspect_ratio}
          noControls={true}
          muted
          playsInline
          preload="metadata"
        />
      );
    } else if (item.video_link && item.media?.filename) {
      return (
        <video
          ref={videoRef}
          src={item.video_link}
          muted
          playsInline
          preload="auto"
          poster={item.media?.filename}
          style={{ width: '100%', height: 'auto' }}
        />
      );
    } else if (
      item.media &&
      typeof item.media === 'object' &&
      'filename' in item.media
    ) {
      return (
        <Image
          src={(item.media as any).filename}
          alt={(item.name as string) || 'Project Image'}
          width={0}
          height={0}
          sizes="100vw"
          quality={80}
          priority={index === 0} // Only prioritize first image
          style={{ width: '100%', height: 'auto' }}
        />
      );
    }
    return null;
  };

  return (
    <div className="blok-ProjectSlider-Item" data-active={isActive}>
      <div className="blok-ProjectSlider-Image">
        <div className="blok-ProjectSlider-ImageWrapper">{renderMedia()}</div>
      </div>
      <div className="blok-ProjectSlider-Caption">
        <div className="blok-ProjectSlider-Caption-Title">
          <span>Featured</span>
          {isActive && progressRef && (
            <div className="blok-ProjectSlider-ProgressWrapper">
              <div className="blok-ProjectSlider-Progress" ref={progressRef} />
            </div>
          )}
          {String(item.name)}
        </div>
        <div className="blok-ProjectSlider-Caption-Year">{item.year}</div>
      </div>
    </div>
  );
};

const BlokProjectSlider = ({ blok }: BlokProjectSliderProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [hasCursor, setHasCursor] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const currentItem = blok.body?.[activeIndex];
  const currentDuration = currentItem?.duration || 800;

  // Detect if device has a cursor (not mobile/tablet)
  useEffect(() => {
    // Check if the device has fine pointer capability (mouse)
    const hasFineCursor = window.matchMedia('(pointer: fine)').matches;
    setHasCursor(hasFineCursor);
  }, []);

  // Animate progress bar
  useGSAP(
    () => {
      if (!progressRef.current || !currentItem) return;

      const duration = currentDuration / 1000;

      gsap.fromTo(
        progressRef.current,
        { width: '0%' },
        {
          width: '100%',
          duration: duration,
          ease: 'linear',
        }
      );
    },
    {
      dependencies: [activeIndex, currentItem, currentDuration],
      revertOnUpdate: true,
    }
  );

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

  if (!blok.body || blok.body.length === 0) return null;

  return (
    <div
      className="blok blok-ProjectSlider blok-Animate"
      {...storyblokEditable(blok)}
    >
      {blok.body.map((item, index) => (
        <SlideItem
          key={item._uid}
          item={item}
          isActive={activeIndex === index}
          index={index}
          progressRef={activeIndex === index ? progressRef : undefined}
        />
      ))}

      <SliderIndicators
        total={blok.body.length}
        activeIndex={activeIndex}
        className="blok-ProjectSlider-Indicators"
      />

      {/* Invisible hover zones - only rendered on devices with cursor */}
      {hasCursor && blok.body.length > 1 && (
        <div
          className="blok-ProjectSlider-HoverZones"
          onMouseLeave={handleZoneLeave}
        >
          {blok.body.map((item, index) => (
            <Link
              key={`zone-${item._uid}`}
              href={item.link?.cached_url || '#'}
              className="blok-ProjectSlider-HoverZone cursorInteract"
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
