import {
  SbBlokData,
  storyblokEditable,
  StoryblokServerComponent,
} from '@storyblok/react/rsc';
import Row from '../Row';
import BlokSidePanels from '../BlokSidePanels/BlokSidePanels';
import GrainyGradient from '@/components/GrainyGradient/GrainyGradient';

type ColumnBehaviour = 'none' | 'hide-first' | 'stack';

interface SbPageData extends SbBlokData {
  body: SbBlokData[];
  columnBehaviour?: ColumnBehaviour;
  wideColumns?: boolean;
}

interface BlokProps {
  blok: SbPageData;
  stackIndex?: number;
  // True for the first blok on a page with an image: that image is the LCP candidate.
  imagePriority?: boolean;
}

const BlokContainer = ({ blok, stackIndex, imagePriority }: BlokProps) => {
  const columnBehaviour = blok.columnBehaviour || (blok.wideColumns ? 'stack' : 'none');
  const desktopColumns = blok.body.filter(
    (column) => column.component !== 'Column Text' || column.display !== 'mobile',
  ).length;
  const mobileColumns = columnBehaviour === 'none'
    ? blok.body.filter((column) => column.component !== 'Column Empty' &&
      (column.component !== 'Column Text' || column.display !== 'desktop')).length
    : 1;
  const firstImageColumn = blok.body.findIndex((c) => c.component === 'Column Image');
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
        {blok.body.map((nestedBlok, index) => (
          <StoryblokServerComponent
            blok={nestedBlok}
            key={nestedBlok._uid}
            imageSizes={imageSizes}
            imagePriority={imagePriority && index === firstImageColumn}
          />
        ))}
      </Row>
    </div>
  );
};

export default BlokContainer;
