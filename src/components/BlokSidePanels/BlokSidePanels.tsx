import TopPanel from './TopPanel';
import BottomPanel from './BottomPanel';
import BackPanel from './BackPanel';

interface BlokSidePanelsProps {
  showTopPanelPortrait?: boolean;
}

const BlokSidePanels = ({ showTopPanelPortrait = false }: BlokSidePanelsProps) => {
  return (
    <>
      <TopPanel showPortrait={showTopPanelPortrait} />
      <BottomPanel />
      <BackPanel />
    </>
  );
};

export default BlokSidePanels;
