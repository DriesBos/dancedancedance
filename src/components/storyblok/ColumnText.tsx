'use client';

import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

interface SbPageData extends SbBlokData {
  text?: string;
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
      ref={container}
      {...storyblokEditable(blok)}
    >
      {blok.text}
    </div>
  );
};

export default ColumnText;
