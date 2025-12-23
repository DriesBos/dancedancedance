'use client';

import MuxPlayerReact from '@mux/mux-player-react/lazy';
import { useEffect, useRef, useState } from 'react';
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
  dynamicAspectRatio?: boolean; // Auto-detect aspect ratio from video metadata (default: true)
  noControls?: boolean; // Hide player controls (default: false)
  loading?: 'page' | 'viewport'; // When to load the player (default: 'viewport')
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
 * @param dynamicAspectRatio - Auto-detect aspect ratio from video metadata (default: true)
 * @param noControls - Hide player controls (default: false)
 * @param loading - When to load the player: 'page' (after page load) or 'viewport' (when visible)
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
  dynamicAspectRatio = true,
  noControls = true,
  loading = 'viewport',
  style,
  className,
  accentColor,
  primaryColor,
  secondaryColor,
  ...rest
}) => {
  const playerRef = useRef<any>(null);
  const [detectedAspectRatio, setDetectedAspectRatio] = useState<string | null>(
    null
  );

  // Handle metadata loaded to detect aspect ratio
  useEffect(() => {
    if (!playerRef.current || !dynamicAspectRatio) return;

    const player = playerRef.current;

    const handleLoadedMetadata = () => {
      // Access the internal video element
      const video = player.media || player.querySelector('video');

      if (video && video.videoWidth && video.videoHeight) {
        const width = video.videoWidth;
        const height = video.videoHeight;
        const calculatedRatio = `${width} / ${height}`;

        if (process.env.NODE_ENV === 'development') {
          console.log('Detected video dimensions:', {
            width,
            height,
            ratio: calculatedRatio,
          });
        }
        setDetectedAspectRatio(calculatedRatio);
      }
    };

    // Try to get metadata immediately if already loaded
    handleLoadedMetadata();

    // Listen for loadedmetadata event
    player.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      player.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [dynamicAspectRatio, playbackId]);

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

  // Use detected aspect ratio if available and dynamicAspectRatio is enabled, otherwise use provided aspectRatio
  const finalAspectRatio =
    dynamicAspectRatio && detectedAspectRatio
      ? detectedAspectRatio
      : aspectRatio;

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
      loading={loading}
      streamType="on-demand"
      nohotkeys={noControls}
      style={{
        width: '100%',
        aspectRatio: finalAspectRatio,
        display: 'block',
        position: 'relative',
        ...style,
      }}
      className={className}
      accentColor={accentColor}
      primaryColor={primaryColor}
      secondaryColor={secondaryColor}
      {...(noControls ? { controls: false } : {})}
      {...rest}
    />
  );
};

export default MuxPlayer;
