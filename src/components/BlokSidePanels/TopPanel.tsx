import GrainyGradient from '../GrainyGradient/GrainyGradient';
import LazyDitheringVideoPortrait from '@/components/LazyDitheringVideoPortrait';
import styles from './BlokSidePanels.module.sass';

interface TopPanelProps {
  showPortrait?: boolean;
}

const TopPanel = ({ showPortrait = false }: TopPanelProps) => {
  const className = `${styles.side} ${styles.side_Top} ${
    showPortrait ? 'cursorMessage' : ''
  } side side_Top`;

  const sharedProps = {
    className,
    'data-cursor-message': showPortrait
      ? 'Schedule a discovery call'
      : undefined,
  } as const;

  if (showPortrait) {
    return (
      <a
        {...sharedProps}
        href="https://calendly.com/info-b9c/30min"
        target="_blank"
        rel="noopener noreferrer"
      >
        <GrainyGradient variant="blok" />
        <LazyDitheringVideoPortrait
          src="/portraits/portrait_movie.mp4"
          alt="Dries Bos top panel dithered portrait"
          variant="panel"
          showControls={false}
          mode="cross"
          pixelSize={3}
          contrast={1.2}
          threshold={138}
        />
      </a>
    );
  }

  return (
    <div {...sharedProps}>
      <GrainyGradient variant="blok" />
    </div>
  );
};

export default TopPanel;
