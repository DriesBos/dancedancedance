import GrainyGradient from '../GrainyGradient/GrainyGradient';
import styles from './BlokSidePanels.module.sass';

const BottomPanel = () => {
  return (
    <div
      className={`${styles.side} ${styles.side_Bottom} ${styles.bottom} side side_Bottom`}
    >
      <GrainyGradient variant="blok" />
    </div>
  );
};

export default BottomPanel;
