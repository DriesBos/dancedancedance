'use client';

import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import MuxPlayer from '../MuxPlayer';

interface SbPageData extends SbBlokData {
  link?: string; // Legacy: direct video URL
  mux_playback_id?: string; // New: Mux playback ID
  placeholder?: {
    filename: string;
    alt: string;
  };
  loop?: boolean;
  pause?: number;
  caption?: string;
  side_caption?: boolean;
  aspect_ratio?: string; // Custom aspect ratio from Storyblok (e.g., "16/9", "4/3", "1/1")
}

interface ColumnVideoProps {
  blok: SbPageData;
}

const ColumnVideo: React.FunctionComponent<ColumnVideoProps> = ({ blok }) => {
  // Support both Mux playback ID and legacy direct video URLs
  const useMux = !!blok.mux_playback_id;

  return (
    <div
      className="column column-Video"
      {...storyblokEditable(blok)}
      data-caption-side={blok.side_caption}
    >
      {useMux ? (
        <MuxPlayer
          playbackId={blok.mux_playback_id!}
          poster={blok.placeholder?.filename}
          loop={blok.loop}
          className="muxPlayer"
          pause={blok.pause}
          aspectRatio={blok.aspect_ratio || '16 / 9'}
          muted
          autoPlay
          playsInline
          preload="auto"
        />
      ) : (
        // Fallback for legacy direct video URLs
        <video
          src={blok.link}
          muted
          loop={blok.loop}
          autoPlay
          playsInline
          preload="auto"
          poster={blok.placeholder?.filename}
          style={{ width: '100%', height: 'auto' }}
        />
      )}
      {blok.caption && <div className="column-Caption">{blok.caption}</div>}
    </div>
  );
};

export default ColumnVideo;
