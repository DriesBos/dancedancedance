import { storyblokEditable, StoryblokComponent } from '@storyblok/react/rsc';

interface Props {
  blok: any;
}

const Blok = ({ blok }: Props) => {
  return (
    <div className="blok" {...storyblokEditable(blok)}>
      {blok.body.map((nestedBlok: any) => (
        <StoryblokComponent blok={nestedBlok} key={nestedBlok._uid} />
      ))}
    </div>
  );
};

export default Blok;
