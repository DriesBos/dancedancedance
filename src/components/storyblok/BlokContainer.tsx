import {
  SbBlokData,
  storyblokEditable,
  StoryblokServerComponent,
} from '@storyblok/react/rsc';
import Row from '../Row';
import BlokSidePanels from '../BlokSides';

interface SbPageData extends SbBlokData {
  body: SbBlokData[];
}

interface BlokProps {
  blok: SbPageData;
}

const BlokContainer = ({ blok }: BlokProps) => {
  return (
    <div className="blok blok-Animate" {...storyblokEditable(blok)}>
      <BlokSidePanels />
      <Row>
        {blok.body.map((nestedBlok: any) => (
          <StoryblokServerComponent blok={nestedBlok} key={nestedBlok._uid} />
        ))}
      </Row>
    </div>
  );
};

export default BlokContainer;
