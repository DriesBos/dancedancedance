import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import MuxPlayer from '../MuxPlayer';
import { storyblokVideoPosterUrl } from '@/lib/storyblok-image';

interface SbPageData extends SbBlokData {
  mux_playback_id?: string;
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
  const optimizedPoster = storyblokVideoPosterUrl(blok.placeholder?.filename);

  return (
    <div
      className="column column-Video"
      {...storyblokEditable(blok)}
      data-caption-side={blok.side_caption}
      data-caption={blok.caption ? true : false}
    >
      {blok.mux_playback_id && (
        <MuxPlayer
          playbackId={blok.mux_playback_id}
          poster={optimizedPoster}
          loop={blok.loop}
          className="muxPlayer imageItem"
          pause={blok.pause}
          aspectRatio={blok.aspect_ratio}
        />
      )}
      {blok.caption && <div className="column-Caption">{blok.caption}</div>}
    </div>
  );
};

export default ColumnVideo;
