import { memo } from 'react';
import GrainyGradient from '../GrainyGradient/GrainyGradient';
import styles from './BlokSidePanels.module.sass';

type TopPanelSurface = 'default' | 'transparent';

interface BlokSidePanelsProps {
  topPanelSurface?: TopPanelSurface;
}

interface PanelProps {
  className: string;
  surface?: TopPanelSurface;
}

const Panel = ({ className, surface }: PanelProps) => (
  <div className={className} data-surface={surface}>
    <GrainyGradient variant="blok" />
  </div>
);

const BlokSidePanelsComponent = ({
  topPanelSurface = 'default',
}: BlokSidePanelsProps) => {
  return (
    <>
      <Panel
        className={`${styles.side} ${styles.side_Top} side side_Top`}
        surface={topPanelSurface}
      />
      <Panel className={`${styles.side} ${styles.side_Bottom} side side_Bottom`} />
      <Panel className={`${styles.side} ${styles.side_Back} side side_Back`} />
    </>
  );
};

const BlokSidePanels = memo(BlokSidePanelsComponent);

BlokSidePanels.displayName = 'BlokSidePanels';

export default BlokSidePanels;
