import {
  SbBlokData,
  storyblokEditable,
  StoryblokServerComponent,
} from '@storyblok/react/rsc';
import Row from '../Row';
import BlokSidePanels from '../BlokSidePanels';
import GrainyGradient from '@/components/GrainyGradient';

type ColumnBehaviour = 'none' | 'hide-first' | 'stack';

interface SbPageData extends SbBlokData {
  body: SbBlokData[];
  columnBehaviour?: ColumnBehaviour;
  wideColumns?: boolean;
}

interface BlokProps {
  blok: SbPageData;
}

const BlokContainer = ({ blok }: BlokProps) => {
  const columnBehaviour = blok.columnBehaviour || (blok.wideColumns ? 'stack' : 'none');

  return (
    <div className="blok blok-Animate" {...storyblokEditable(blok)}>
      <GrainyGradient variant="blok" />
      <BlokSidePanels />
      <Row columnBehaviour={columnBehaviour}>
        {blok.body.map((nestedBlok) => (
          <StoryblokServerComponent blok={nestedBlok} key={nestedBlok._uid} />
        ))}
      </Row>
    </div>
  );
};

export default BlokContainer;
