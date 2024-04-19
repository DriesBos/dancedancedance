import { storyblokEditable } from '@storyblok/react/rsc';

const Teaser = ({ blok }) => {
  return <h2 {...storyblokEditable(blok)}>TEASERBLOK {blok.headline}</h2>;
};

export default Teaser;
