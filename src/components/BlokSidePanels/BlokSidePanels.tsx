import { memo } from 'react';
import GrainyGradient from '../GrainyGradient/GrainyGradient';
import styles from './BlokSidePanels.module.sass';

interface PanelProps {
  className: string;
}

const Panel = ({ className }: PanelProps) => (
  <div className={className}>
    <GrainyGradient variant="blok" />
  </div>
);

const BlokSidePanelsComponent = () => {
  return (
    <>
      <Panel className={`${styles.side} ${styles.side_Top} side side_Top`} />
      <Panel className={`${styles.side} ${styles.side_Bottom} side side_Bottom`} />
      <Panel className={`${styles.side} ${styles.side_Back} side side_Back`} />
    </>
  );
};

const BlokSidePanels = memo(BlokSidePanelsComponent);

BlokSidePanels.displayName = 'BlokSidePanels';

export default BlokSidePanels;
