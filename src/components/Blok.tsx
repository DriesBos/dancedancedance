import { storyblokEditable, StoryblokComponent } from '@storyblok/react/rsc';

interface Props {
  blok: any;
}

const Blok = ({ blok }: Props) => (
  <div className="blok" {...storyblokEditable(blok)}>
    <p>BLOK</p>
    {blok.body.map((nestedBlok: any) => (
      <StoryblokComponent blok={nestedBlok} key={nestedBlok._uid} />
    ))}
  </div>
);

export default Blok;
