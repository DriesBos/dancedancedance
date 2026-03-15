import { memo } from 'react';
import GrainyGradient from '../GrainyGradient/GrainyGradient';
import styles from './BlokSidePanels.module.sass';

const BottomPanel = memo(function BottomPanel() {
  return (
    <div
      className={`${styles.side} ${styles.side_Bottom} side side_Bottom`}
    >
      <GrainyGradient variant="blok" />
    </div>
  );
});

export default BottomPanel;
