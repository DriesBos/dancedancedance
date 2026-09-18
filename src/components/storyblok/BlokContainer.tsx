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
  stackIndex?: number;
}

const BlokContainer = ({ blok, stackIndex }: BlokProps) => {
  const columnBehaviour = blok.columnBehaviour || (blok.wideColumns ? 'stack' : 'none');
  const desktopColumns = blok.body.filter(
    (column) => column.component !== 'Column Text' || column.display !== 'mobile',
  ).length;
  const mobileColumns = columnBehaviour === 'none'
    ? blok.body.filter((column) => column.component !== 'Column Empty' &&
      (column.component !== 'Column Text' || column.display !== 'desktop')).length
    : 1;
  const imageSizes = `(max-width: 770px) ${100 / Math.max(1, mobileColumns)}vw, ${100 / Math.max(1, desktopColumns)}vw`;

  return (
    <div
      className="blok blok-Animate"
      data-stack-item={stackIndex !== undefined ? true : undefined}
      style={{ zIndex: stackIndex }}
      {...storyblokEditable(blok)}
    >
      <GrainyGradient variant="blok" />
      <BlokSidePanels />
      <Row columnBehaviour={columnBehaviour}>
        {blok.body.map((nestedBlok) => (
          <StoryblokServerComponent blok={nestedBlok} key={nestedBlok._uid} imageSizes={imageSizes} />
        ))}
      </Row>
    </div>
  );
};

export default BlokContainer;
