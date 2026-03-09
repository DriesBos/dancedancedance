import GrainyGradient from '../GrainyGradient/GrainyGradient';
import LazyDitheringVideoPortrait from '@/components/LazyDitheringVideoPortrait';
import styles from './BlokSidePanels.module.sass';

interface TopPanelProps {
  showPortrait?: boolean;
}

const TopPanel = ({ showPortrait = false }: TopPanelProps) => {
  return (
    <div
      className={`${styles.side} ${styles.side_Top} ${showPortrait ? 'cursorMessage' : null} side side_Top`}
      data-cursor-message={showPortrait ? "Let's talk" : undefined}
    >
      <GrainyGradient variant="blok" />
      {showPortrait && (
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
      )}
    </div>
  );
};

export default TopPanel;
