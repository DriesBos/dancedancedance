'use client';

import MuxPlayerReact from '@mux/mux-player-react/lazy';
import { useEffect, useRef, useState } from 'react';
import type { MuxPlayerRefAttributes } from '@mux/mux-player-react';
import '@/assets/styles/mux-player.css';

interface MuxPlayerProps {
  playbackId: string;
  poster?: string;
  loop?: boolean;
  pause?: number;
  aspectRatio?: string;
  className?: string;
}

export default function MuxPlayer({
  playbackId,
  poster,
  loop = false,
  aspectRatio,
  className,
}: MuxPlayerProps) {
  const playerRef = useRef<MuxPlayerRefAttributes | null>(null);
  const [detectedAspectRatio, setDetectedAspectRatio] = useState<string>();

  useEffect(() => {
    if (aspectRatio) return;
    const player = playerRef.current;
    if (!player) return;

    const detectAspectRatio = () => {
      const video =
        player.media instanceof HTMLVideoElement
          ? player.media
          : player.querySelector('video');

      if (video?.videoWidth && video.videoHeight) {
        setDetectedAspectRatio(`${video.videoWidth} / ${video.videoHeight}`);
      }
    };

    detectAspectRatio();
    player.addEventListener('loadedmetadata', detectAspectRatio);
    return () => player.removeEventListener('loadedmetadata', detectAspectRatio);
  }, [aspectRatio, playbackId]);

  return (
    <MuxPlayerReact
      ref={playerRef}
      playbackId={playbackId}
      poster={poster}
      placeholder={
        poster || `https://image.mux.com/${playbackId}/thumbnail.jpg?time=0`
      }
      loop={loop}
      muted
      autoPlay
      playsInline
      preload="metadata"
      loading="viewport"
      streamType="on-demand"
      nohotkeys
      className={className}
      {...{ controls: false }}
      style={{
        width: '100%',
        aspectRatio: aspectRatio || detectedAspectRatio || '16 / 9',
      }}
    />
  );
}
