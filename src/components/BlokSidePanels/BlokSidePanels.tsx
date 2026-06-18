import { memo } from 'react';
import TopPanel from './TopPanel';
import BottomPanel from './BottomPanel';
import BackPanel from './BackPanel';

interface BlokSidePanelsProps {
  showTopPanelPortrait?: boolean;
  topPanelSurface?: 'default' | 'transparent';
}

const BlokSidePanelsComponent = ({
  showTopPanelPortrait = false,
  topPanelSurface = 'default',
}: BlokSidePanelsProps) => {
  return (
    <>
      <TopPanel
        showPortrait={showTopPanelPortrait}
        surface={topPanelSurface}
      />
      <BottomPanel />
      <BackPanel />
    </>
  );
};

const BlokSidePanels = memo(
  BlokSidePanelsComponent,
  (prevProps, nextProps) =>
    prevProps.showTopPanelPortrait === nextProps.showTopPanelPortrait &&
    prevProps.topPanelSurface === nextProps.topPanelSurface,
);

BlokSidePanels.displayName = 'BlokSidePanels';

export default BlokSidePanels;
