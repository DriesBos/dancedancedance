import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import type { HTMLAttributes } from 'react';
import TheMarkdown from '../TheMarkdown/TheMarkdown';
import ColumnTextClient from './ColumnTextClient';

interface SbPageData extends SbBlokData {
  text?: string;
  color?: 'primary' | 'secondary';
  display?: 'all' | 'desktop' | 'mobile';
}

interface ColumnTextProps {
  blok: SbPageData;
}

const ColumnText = ({ blok }: ColumnTextProps) => {
  const editableAttributes =
    storyblokEditable(blok) as HTMLAttributes<HTMLDivElement>;

  return (
    <ColumnTextClient
      color={blok.color}
      display={blok.display}
      editableAttributes={editableAttributes}
    >
      <TheMarkdown content={blok.text || ''} />
    </ColumnTextClient>
  );
};

export default ColumnText;
