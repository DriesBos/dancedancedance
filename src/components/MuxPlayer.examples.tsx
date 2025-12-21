/**
 * Example usage of the MuxPlayer component
 * 
 * This file shows various ways to use the MuxPlayer component
 * in your Next.js + Storyblok project
 * 
 * NEW: Dynamic aspect ratio detection from video metadata!
 */

import MuxPlayer from '@/components/MuxPlayer';

// Example 1: Auto-detect aspect ratio (RECOMMENDED - Default behavior)
export function AutoAspectRatioExample() {
  return (
    <MuxPlayer
      playbackId="your-mux-playback-id"
      autoPlay
      loop
      muted
      playsInline
      // dynamicAspectRatio defaults to true
      // Aspect ratio is automatically detected from video metadata!
    />
  );
}

// Example 2: Force specific aspect ratio (override auto-detection)
export function ForceAspectRatioExample() {
  return (
    <MuxPlayer
      playbackId="your-mux-playback-id"
      aspectRatio="1 / 1"
      dynamicAspectRatio={false} // Disable auto-detection
      autoPlay
      loop
      muted
      playsInline
    />
  );
}

// Example 3: With poster image (auto-detect aspect ratio)
export function VideoWithPosterExample() {
  return (
    <MuxPlayer
      playbackId="your-mux-playback-id"
      poster="https://example.com/poster.jpg"
      autoPlay
      muted
      playsInline
      // Aspect ratio auto-detected from video
    />
  );
}

// Example 4: Square video with forced aspect ratio for Instagram
export function SquareVideoExample() {
  return (
    <MuxPlayer
      playbackId="your-mux-playback-id"
      aspectRatio="1 / 1"
      dynamicAspectRatio={false}
      autoPlay
      loop
      muted
      playsInline
    />
  );
}

// Example 5: Portrait video - auto-detected as 9:16
export function PortraitVideoExample() {
  return (
    <MuxPlayer
      playbackId="your-mux-playback-id"
      // If video is 1080x1920, it will auto-detect as "1080 / 1920" (9:16)
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

// Example 10: Use in Storyblok with smart aspect ratio handling
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
        aspectRatio={blok.aspect_ratio || '16 / 9'} // Fallback if not detected
        dynamicAspectRatio={!blok.aspect_ratio} // Auto-detect only if not manually set
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

// Example 11: Mixed content with auto-detection
export function MixedContentExample({ videos }: { videos: any[] }) {
  return (
    <div className="video-grid">
      {videos.map((video) => (
        <MuxPlayer
          key={video.id}
          playbackId={video.mux_playback_id}
          aspectRatio={video.aspect_ratio} // Use manual if provided
          dynamicAspectRatio={!video.aspect_ratio} // Auto-detect if not provided
          poster={video.poster}
          autoPlay={false}
          muted
          playsInline
        />
      ))}
    </div>
  );
}

