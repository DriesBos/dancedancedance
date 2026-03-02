import GrainyGradient from '../GrainyGradient/GrainyGradient';
import styles from './BlokSidePanels.module.sass';

const BackPanel = () => {
  return (
    <div className={`${styles.side} ${styles.side_Back} ${styles.back}`}>
      <GrainyGradient variant="blok" />
    </div>
  );
};

export default BackPanel;
