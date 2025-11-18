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
}

interface ColumnVideoProps {
  blok: SbPageData;
}

const ColumnVideo: React.FunctionComponent<ColumnVideoProps> = ({ blok }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current || !blok.pause || !blok.loop) return;

    const video = videoRef.current;

    const handleEnded = () => {
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play();
        }
      }, blok.pause); // Use pause prop directly as milliseconds
    };

    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('ended', handleEnded);
    };
  }, [blok.pause, blok.loop]);

  console.log('blok.video', blok);
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
      {/* <Image
        src={blok.placeholder.filename}
        alt={blok.placeholder.alt}
        width={0}
        height={0}
        sizes="100vw"
        quality={90}
        style={{ width: '100%', height: 'auto' }}
      /> */}
    </div>
  );
};

export default ColumnVideo;
