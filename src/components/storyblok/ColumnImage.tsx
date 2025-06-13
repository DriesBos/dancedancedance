import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';

interface SbPageData extends SbBlokData {
  body: SbBlokData[];
}

interface ColumnImageProps {
  blok: SbPageData;
}

const ColumnImage: React.FunctionComponent<ColumnImageProps> = ({ blok }) => {
  return (
    <div className="column column-Image" {...storyblokEditable(blok)}>
      {/* <img src={blok.image.filename} alt={blok.image.alt} /> */}
    </div>
  );
};

export default ColumnImage;
