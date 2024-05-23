import { storyblokEditable } from '@storyblok/react/rsc';

interface Props {
  blok: any;
}

const ColumnImage = ({ blok }: Props) => (
  <div className="column column-Image" {...storyblokEditable(blok)}></div>
);

export default ColumnImage;
