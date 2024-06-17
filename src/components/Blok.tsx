import { storyblokEditable, StoryblokComponent } from '@storyblok/react/rsc';
import Row from './Row';
import BlokTopPanel from '@/components/Icons/BlokTopPanel';

interface Props {
  blok: any;
}

const Blok = ({ blok }: Props) => {
  return (
    <div className="blok" {...storyblokEditable(blok)}>
      <BlokTopPanel />
      <Row>
        {blok.body.map((nestedBlok: any) => (
          <StoryblokComponent blok={nestedBlok} key={nestedBlok._uid} />
        ))}
      </Row>
    </div>
  );
};

export default Blok;
