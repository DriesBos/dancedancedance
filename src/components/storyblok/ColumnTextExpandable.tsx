'use client';

import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import TheMarkdown from '../TheMarkdown/TheMarkdown';

interface SbPageData extends SbBlokData {
  text?: string;
  more?: string;
  details?: string;
}

interface ColumnTextExpandableProps {
  blok: SbPageData;
}

const ColumnTextExpandable: React.FunctionComponent<
  ColumnTextExpandableProps
> = ({ blok }) => {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!container.current) return;

      gsap.to(container.current, {
        '--var': '100%',
        duration: 0.66,
        delay: 0.33,
        ease: 'ease',
      });
    },
    { scope: container }
  );

  return (
    <div
      className="column column-Text column-TextExpandable"
      ref={container}
      {...storyblokEditable(blok)}
    >
      {blok.text && (
        <div className="column-TextExpandable-Main">
          <TheMarkdown content={blok.text} />
        </div>
      )}
      {blok.more && (
        <div className="column-TextExpandable-More">
          {blok.more && <TheMarkdown content={blok.more} />}
        </div>
      )}
      {blok.details && (
        <div className="column-TextExpandable-Details">
          {blok.details && <TheMarkdown content={blok.details} />}
        </div>
      )}
    </div>
  );
};

export default ColumnTextExpandable;
