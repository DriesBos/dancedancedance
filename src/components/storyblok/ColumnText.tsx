'use client';

import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import TheMarkdown from '../TheMarkdown/TheMarkdown';

interface SbPageData extends SbBlokData {
  text?: string;
  color?: 'primary' | 'secondary';
  display?: 'all' | 'desktop' | 'mobile';
}

interface ColumnTextProps {
  blok: SbPageData;
}

const ColumnText: React.FunctionComponent<ColumnTextProps> = ({ blok }) => {
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
      className="column column-Text"
      data-display={blok.display}
      data-color={blok.color}
      ref={container}
      {...storyblokEditable(blok)}
    >
      <TheMarkdown content={blok.text} />
    </div>
  );
};

export default ColumnText;
