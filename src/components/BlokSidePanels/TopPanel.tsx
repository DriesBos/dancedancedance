import GrainyGradient from '../GrainyGradient/GrainyGradient';
import DitheringVideoPortrait from '@/components/DitheringVideoPortrait';
import styles from './BlokSidePanels.module.sass';

interface TopPanelProps {
  showPortrait?: boolean;
}

const TopPanel = ({ showPortrait = false }: TopPanelProps) => {
  return (
    <div className={`${styles.side} ${styles.side_Top} side side_Top`}>
      <GrainyGradient variant="blok" />
      {showPortrait && (
        <DitheringVideoPortrait
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
