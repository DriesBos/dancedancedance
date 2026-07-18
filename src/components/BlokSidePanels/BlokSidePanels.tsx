import { memo } from 'react';
import GrainyGradient from '../GrainyGradient/GrainyGradient';
import styles from './BlokSidePanels.module.sass';

const BlokSidePanelsComponent = () => (
  <div className={`${styles.side} ${styles.side_Top} side side_Top`}>
    <GrainyGradient variant="blok" />
  </div>
);

const BlokSidePanels = memo(BlokSidePanelsComponent);

BlokSidePanels.displayName = 'BlokSidePanels';

export default BlokSidePanels;
