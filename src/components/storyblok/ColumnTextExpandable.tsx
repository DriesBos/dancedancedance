import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import type { HTMLAttributes } from 'react';
import TheMarkdown from '../TheMarkdown/TheMarkdown';
import ColumnTextExpandableClient from './ColumnTextExpandableClient';
import { DEFAULT_LOCALE } from '@/lib/locale';

interface SbPageData extends SbBlokData {
  text?: string;
  more?: string;
  details?: string;
}

interface ColumnTextExpandableProps {
  blok: SbPageData;
}

const ColumnTextExpandable = ({ blok }: ColumnTextExpandableProps) => {
  const locale = DEFAULT_LOCALE;
  const editableAttributes =
    storyblokEditable(blok) as HTMLAttributes<HTMLDivElement>;

  return (
    <ColumnTextExpandableClient
      editableAttributes={editableAttributes}
      text={blok.text ? <TheMarkdown content={blok.text} locale={locale} /> : null}
      more={blok.more ? <TheMarkdown content={blok.more} locale={locale} /> : null}
      details={
        blok.details ? (
          <TheMarkdown content={blok.details} locale={locale} />
        ) : null
      }
    />
  );
};

export default ColumnTextExpandable;
