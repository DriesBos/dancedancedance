'use client';

import MuxPlayerReact from '@mux/mux-player-react';
import { useEffect, useRef } from 'react';
import '@/assets/styles/mux-player.css';

interface MuxPlayerProps {
  playbackId: string;
  poster?: string;
  loop?: boolean;
  muted?: boolean;
  autoPlay?: boolean;
  playsInline?: boolean;
  pause?: number; // Delay in seconds between loops (only works when loop is true)
  preload?: 'auto' | 'metadata' | 'none';
  aspectRatio?: string; // Custom aspect ratio from Storyblok (e.g., "16/9", "4/3", "1/1")
  style?: React.CSSProperties;
  className?: string;
  accentColor?: string;
  primaryColor?: string;
  secondaryColor?: string;
  // Additional Mux Player props
  [key: string]: any;
}

/**
 * Reusable Mux Player component for Next.js + Storyblok
 *
 * @param playbackId - The Mux playback ID (required)
 * @param poster - URL for the poster image
 * @param loop - Whether to loop the video
 * @param muted - Whether to mute the video
 * @param autoPlay - Whether to autoplay the video
 * @param playsInline - Whether to play inline (important for mobile)
 * @param pause - Optional delay in seconds between loops (custom feature)
 * @param preload - Preload strategy: 'auto', 'metadata', or 'none'
 * @param aspectRatio - Custom aspect ratio from Storyblok (e.g., "16/9", "4/3", "1/1")
 * @param style - Inline styles
 * @param className - CSS class name
 * @param accentColor - Mux Player accent color
 * @param primaryColor - Mux Player primary color
 * @param secondaryColor - Mux Player secondary color
 */
const MuxPlayer: React.FC<MuxPlayerProps> = ({
  playbackId,
  poster,
  loop = false,
  muted = true,
  autoPlay = false,
  playsInline = true,
  pause,
  preload = 'auto',
  aspectRatio = '16 / 9',
  style,
  className,
  accentColor,
  primaryColor,
  secondaryColor,
  ...rest
}) => {
  const playerRef = useRef<any>(null);

  console.log('aspectRatio', aspectRatio);

  // Handle pause between loops (custom feature)
  useEffect(() => {
    if (!playerRef.current || !loop || !pause || pause <= 0) return;

    const player = playerRef.current;

    const handleEnded = () => {
      // Disable native loop temporarily
      player.loop = false;

      setTimeout(() => {
        if (playerRef.current) {
          playerRef.current.play().catch((error: Error) => {
            console.warn('Video play after pause failed:', error);
          });
        }
      }, pause * 1000);
    };

    player.addEventListener('ended', handleEnded);

    return () => {
      player.removeEventListener('ended', handleEnded);
    };
  }, [pause, loop]);

  // Determine if we should use native loop or custom pause loop
  const shouldUseNativeLoop = loop && (!pause || pause <= 0);

  return (
    <MuxPlayerReact
      ref={playerRef}
      playbackId={playbackId}
      poster={poster}
      loop={shouldUseNativeLoop}
      muted={muted}
      autoPlay={autoPlay}
      playsInline={playsInline}
      preload={preload}
      streamType="on-demand"
      style={{
        width: '100%',
        aspectRatio: aspectRatio,
        display: 'block',
        position: 'relative',
        ...style,
      }}
      className={className}
      accentColor={accentColor}
      primaryColor={primaryColor}
      secondaryColor={secondaryColor}
      {...rest}
    />
  );
};

export default MuxPlayer;
