import { storyblokEditable } from '@storyblok/react/rsc';

interface Props {
  blok: any;
}

const ColumnImage = ({ blok }: Props) => {
  return (
    <div className="column column-Image" {...storyblokEditable(blok)}>
      <img src={blok.image.filename} alt={blok.image.alt} />
    </div>
  );
};

export default ColumnImage;
