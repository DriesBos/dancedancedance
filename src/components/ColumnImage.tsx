import { storyblokEditable } from '@storyblok/react/rsc';

interface Props {
  blok: any;
}

const ColumnImage = ({ blok }: Props) => (
  <div {...storyblokEditable(blok)}>
    <p>COLUMN IMAGE</p>
  </div>
);

export default ColumnImage;
