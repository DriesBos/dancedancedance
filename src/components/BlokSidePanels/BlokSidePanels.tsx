import GrainyGradient from '../GrainyGradient/GrainyGradient';
import styles from './BlokSidePanels.module.sass';

const BlokSidePanels = () => (
  <div className={`${styles.side} ${styles.side_Top} side side_Top`}>
    <GrainyGradient variant="blok" />
  </div>
);

export default BlokSidePanels;
