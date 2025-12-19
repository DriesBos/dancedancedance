'use client';

import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import { useEffect, useRef } from 'react';
// import Image from 'next/image';

interface SbPageData extends SbBlokData {
  link?: string;
  placeholder?: {
    filename: string;
    alt: string;
  };
  loop?: boolean;
  pause?: number;
  caption?: string;
}

interface ColumnVideoProps {
  blok: SbPageData;
}

const ColumnVideo: React.FunctionComponent<ColumnVideoProps> = ({ blok }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current || !blok.loop) return;

    const video = videoRef.current;

    // If pause > 0, add delay between loops; otherwise use native loop
    if (blok.pause && blok.pause > 0) {
      const handleEnded = () => {
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play();
          }
        }, blok.pause * 1000); // 3 second delay between plays
      };

      video.addEventListener('ended', handleEnded);

      return () => {
        video.removeEventListener('ended', handleEnded);
      };
    } else {
      // No pause, use native loop
      video.loop = true;
    }
  }, [blok.pause, blok.loop]);

  return (
    <div className="column column-Video" {...storyblokEditable(blok)}>
      <video
        ref={videoRef}
        src={blok.link}
        muted
        loop={false} // Disable native loop to control custom loop
        autoPlay
        playsInline
        preload="auto"
        poster={blok.placeholder?.filename}
        width="100%"
        height="auto"
      />
      {blok.caption && <div className="column-Caption">{blok.caption}</div>}
    </div>
  );
};

export default ColumnVideo;
