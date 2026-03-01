import GrainyGradient from './GrainyGradient/GrainyGradient';

interface Props {
  className?: any;
}
const BlokSidePanels = ({ className }: Props) => {
  return (
    <div className="side side_Top">
      <GrainyGradient variant="blok" />
    </div>
  );
};

export default BlokSidePanels;
