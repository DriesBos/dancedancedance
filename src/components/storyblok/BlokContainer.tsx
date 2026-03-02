import {
  SbBlokData,
  storyblokEditable,
  StoryblokServerComponent,
} from '@storyblok/react/rsc';
import Row from '../Row';
import { TopPanel } from '../BlokSidePanels';
import GrainyGradient from '@/components/GrainyGradient';

interface SbPageData extends SbBlokData {
  body: SbBlokData[];
  wideColumns?: boolean;
}

interface BlokProps {
  blok: SbPageData;
}

const BlokContainer = ({ blok }: BlokProps) => {
  return (
    <div className="blok blok-Animate" {...storyblokEditable(blok)}>
      <GrainyGradient variant="blok" />
      <TopPanel />
      <Row wideColumns={blok.wideColumns}>
        {blok.body.map((nestedBlok: any) => (
          <StoryblokServerComponent blok={nestedBlok} key={nestedBlok._uid} />
        ))}
      </Row>
    </div>
  );
};

export default BlokContainer;
