'use client';

import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import TheMarkdown from '../TheMarkdown/TheMarkdown';

gsap.registerPlugin(useGSAP);

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
  const container = useRef(null);

  useGSAP(() => {
    gsap.to('.column-Text', {
      '--var': '100%',
      duration: 0.66,
      delay: 0.33,
      ease: 'ease',
    });
  });
  return (
    <div
      className="column column-Text column-TextExpandable"
      ref={container}
      {...storyblokEditable(blok)}
    >
      <div className="column-TextExpandable-Main">
        <TheMarkdown content={blok.text} />
      </div>
      <div className="column-TextExpandable-More">
        {blok.more && <TheMarkdown content={blok.more} />}
      </div>
      <div className="column-TextExpandable-Details">
        {blok.details && <TheMarkdown content={blok.details} />}
      </div>
    </div>
  );
};

export default ColumnTextExpandable;
