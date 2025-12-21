/**
 * Example usage of the MuxPlayer component
 * 
 * This file shows various ways to use the MuxPlayer component
 * in your Next.js + Storyblok project
 */

import MuxPlayer from '@/components/MuxPlayer';

// Example 1: Basic usage with autoplay and loop
export function BasicVideoExample() {
  return (
    <MuxPlayer
      playbackId="your-mux-playback-id"
      autoPlay
      loop
      muted
      playsInline
    />
  );
}

// Example 2: With poster image and custom aspect ratio
export function VideoWithPosterExample() {
  return (
    <MuxPlayer
      playbackId="your-mux-playback-id"
      poster="https://example.com/poster.jpg"
      aspectRatio="16 / 9"
      autoPlay
      muted
      playsInline
    />
  );
}

// Example 3: Square video (1:1) for social media
export function SquareVideoExample() {
  return (
    <MuxPlayer
      playbackId="your-mux-playback-id"
      aspectRatio="1 / 1"
      autoPlay
      loop
      muted
      playsInline
    />
  );
}

// Example 4: Portrait video (9:16) for mobile
export function PortraitVideoExample() {
  return (
    <MuxPlayer
      playbackId="your-mux-playback-id"
      aspectRatio="9 / 16"
      autoPlay
      muted
      playsInline
    />
  );
}

// Example 5: Cinematic widescreen (21:9)
export function CinematicVideoExample() {
  return (
    <MuxPlayer
      playbackId="your-mux-playback-id"
      aspectRatio="21 / 9"
      poster="https://example.com/poster.jpg"
      autoPlay
      muted
      playsInline
    />
  );
}

// Example 6: With custom pause between loops (3 seconds)
export function VideoWithPauseExample() {
  return (
    <MuxPlayer
      playbackId="your-mux-playback-id"
      loop
      pause={3} // 3 second delay between loops
      aspectRatio="16 / 9"
      muted
      autoPlay
      playsInline
    />
  );
}

// Example 7: Customized player colors with aspect ratio
export function CustomStyledVideoExample() {
  return (
    <MuxPlayer
      playbackId="your-mux-playback-id"
      aspectRatio="4 / 3"
      accentColor="#ff6b6b"
      primaryColor="#1a1a1a"
      secondaryColor="#ffffff"
      autoPlay
      muted
      playsInline
      style={{
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}
    />
  );
}

// Example 8: Responsive video with custom styling
export function ResponsiveVideoExample() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <MuxPlayer
        playbackId="your-mux-playback-id"
        poster="https://example.com/poster.jpg"
        aspectRatio="16 / 9"
        loop
        muted
        autoPlay
        playsInline
        preload="auto"
        className="custom-video-player"
      />
    </div>
  );
}

// Example 9: Video with all options including dynamic aspect ratio
export function FullFeaturedVideoExample() {
  return (
    <MuxPlayer
      playbackId="your-mux-playback-id"
      poster="https://example.com/poster.jpg"
      loop={true}
      pause={5} // 5 second pause between loops
      aspectRatio="16 / 9" // Dynamic aspect ratio
      muted={true}
      autoPlay={true}
      playsInline={true}
      preload="auto"
      accentColor="#007bff"
      primaryColor="#000000"
      secondaryColor="#ffffff"
      style={{
        width: '100%',
        borderRadius: '8px',
      }}
      className="featured-video"
    />
  );
}

// Example 10: Use in a Storyblok component with dynamic aspect ratio
export function StoryblokVideoExample({ blok }: any) {
  // Check if Mux playback ID exists
  if (!blok.mux_playback_id) {
    return null;
  }

  return (
    <div className="video-wrapper">
      <MuxPlayer
        playbackId={blok.mux_playback_id}
        poster={blok.poster_image?.filename}
        aspectRatio={blok.aspect_ratio || '16 / 9'} // Dynamic from Storyblok
        loop={blok.loop}
        pause={blok.pause_duration}
        muted
        autoPlay
        playsInline
      />
      {blok.caption && (
        <p className="video-caption">{blok.caption}</p>
      )}
    </div>
  );
}

