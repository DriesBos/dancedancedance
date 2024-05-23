import { storyblokEditable } from '@storyblok/react/rsc';

interface Props {
  blok: any;
}

const ColumnText = ({ blok }: Props) => {
  // console.log('COLUMN TEXT', blok);
  return (
    <div {...storyblokEditable(blok)}>
      <p>{blok.text}</p>
    </div>
  );
};

export default ColumnText;
