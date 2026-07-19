'use client';

import { memo, useRef } from 'react';
import GrainyGradient from '@/components/GrainyGradient';
import BlokSidePanels from '@/components/BlokSidePanels';
import BlokHeadBehavior from './BlokHeadBehavior';
import BlokHeadRouteContentContainer from './BlokHeadRouteContentContainer';
import styles from './BlokHead.module.sass';

interface Props {
  projects: Array<{
    slug: string;
    external_link?: { cached_url: string };
  }>;
}

const BlokHeadComponent = ({ projects }: Props) => {
  const headRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={headRef}
      className={`${styles.blokHeadFrame} blok blok-Head blok-AnimateHead`}
      data-active="false"
      data-scroll-start="true"
    >
      <div className={styles.blokHead}>
        <GrainyGradient variant="blok" />
        <BlokHeadBehavior headRef={headRef} />
        <BlokSidePanels />
        <BlokHeadRouteContentContainer projects={projects} />
      </div>
    </div>
  );
};

const BlokHead = memo(BlokHeadComponent);

BlokHead.displayName = 'BlokHead';

export default BlokHead;
