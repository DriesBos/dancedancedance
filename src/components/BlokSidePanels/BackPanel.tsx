import { memo } from 'react';
import GrainyGradient from '../GrainyGradient/GrainyGradient';
import styles from './BlokSidePanels.module.sass';

const BackPanel = memo(function BackPanel() {
  return (
    <div className={`${styles.side} ${styles.side_Back} side side_Back`}>
      <GrainyGradient variant="blok" />
    </div>
  );
});

export default BackPanel;
