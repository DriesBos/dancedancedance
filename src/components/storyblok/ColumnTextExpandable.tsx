import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import type { HTMLAttributes } from 'react';
import TheMarkdown from '../TheMarkdown/TheMarkdown';
import ColumnTextExpandableClient from './ColumnTextExpandableClient';

interface SbPageData extends SbBlokData {
  text?: string;
  more?: string;
  details?: string;
}

interface ColumnTextExpandableProps {
  blok: SbPageData;
}

const ColumnTextExpandable = ({ blok }: ColumnTextExpandableProps) => {
  const editableAttributes =
    storyblokEditable(blok) as HTMLAttributes<HTMLDivElement>;

  return (
    <ColumnTextExpandableClient
      editableAttributes={editableAttributes}
      text={blok.text ? <TheMarkdown content={blok.text} /> : null}
      more={blok.more ? <TheMarkdown content={blok.more} /> : null}
      details={blok.details ? <TheMarkdown content={blok.details} /> : null}
    />
  );
};

export default ColumnTextExpandable;
