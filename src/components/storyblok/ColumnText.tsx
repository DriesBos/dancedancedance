'use client';

import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import TheMarkdown from '../TheMarkdown/TheMarkdown';

gsap.registerPlugin(useGSAP);

interface SbPageData extends SbBlokData {
  text?: string;
  color?: 'primary' | 'secondary';
  display?: 'all' | 'desktop' | 'mobile';
}

interface ColumnTextProps {
  blok: SbPageData;
}

const ColumnText: React.FunctionComponent<ColumnTextProps> = ({ blok }) => {
  const container = useRef(null);

  useGSAP(
    () => {
      gsap.to('.column-Text', {
        '--var': '100%',
        duration: 0.66,
        delay: 0.33,
        ease: 'ease',
      });
    }
    // { scope: container }
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
