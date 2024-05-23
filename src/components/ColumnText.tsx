import { storyblokEditable } from '@storyblok/react/rsc';
import Markdown from 'marked-react';

interface Props {
  blok: any;
}

const ColumnText = ({ blok }: Props) => {
  return (
    <div {...storyblokEditable(blok)}>
      <Markdown>{blok.text}</Markdown>;
    </div>
  );
};

export default ColumnText;
