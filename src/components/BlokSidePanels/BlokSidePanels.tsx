import { memo } from 'react';
import TopPanel from './TopPanel';
import BottomPanel from './BottomPanel';
import BackPanel from './BackPanel';

interface BlokSidePanelsProps {
  showTopPanelPortrait?: boolean;
}

const BlokSidePanelsComponent = ({
  showTopPanelPortrait = false,
}: BlokSidePanelsProps) => {
  return (
    <>
      <TopPanel showPortrait={showTopPanelPortrait} />
      <BottomPanel />
      <BackPanel />
    </>
  );
};

const BlokSidePanels = memo(
  BlokSidePanelsComponent,
  (prevProps, nextProps) =>
    prevProps.showTopPanelPortrait === nextProps.showTopPanelPortrait,
);

BlokSidePanels.displayName = 'BlokSidePanels';

export default BlokSidePanels;
