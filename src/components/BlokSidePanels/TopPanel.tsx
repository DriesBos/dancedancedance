import GrainyGradient from '../GrainyGradient/GrainyGradient';
import styles from './BlokSidePanels.module.sass';

const TopPanel = () => {
  return (
    <div className={`${styles.side} ${styles.side_Top} side side_Top`}>
      <GrainyGradient variant="blok" />
    </div>
  );
};

export default TopPanel;
