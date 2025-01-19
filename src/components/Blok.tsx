import { storyblokEditable, StoryblokComponent } from '@storyblok/react/rsc';
import Row from './Row';
import BlokSidePanels from './BlokSides';

interface Props {
  blok: any;
}

const Blok = ({ blok }: Props) => {
  return (
    <div className="blok" {...storyblokEditable(blok)}>
      <BlokSidePanels />
      <Row>
        {blok.body.map((nestedBlok: any) => (
          <StoryblokComponent blok={nestedBlok} key={nestedBlok._uid} />
        ))}
      </Row>
    </div>
  );
};

export default Blok;
