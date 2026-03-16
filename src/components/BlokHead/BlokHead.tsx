'use client';

import { memo, useRef } from 'react';
import GrainyGradient from '@/components/GrainyGradient';
import BlokHeadBehavior from './BlokHeadBehavior';
import BlokHeadRouteContentContainer from './BlokHeadRouteContentContainer';
import BlokHeadSidePanels from './BlokHeadSidePanels';
import styles from './BlokHead.module.sass';

interface Props {
  projects: Array<{
    slug: string;
    external_link?: { cached_url: string };
  }>;
}

const haveProjectsChanged = (
  prevProjects: Props['projects'],
  nextProjects: Props['projects'],
) => {
  if (prevProjects === nextProjects) return false;
  if (prevProjects.length !== nextProjects.length) return true;

  for (let index = 0; index < prevProjects.length; index += 1) {
    const previousProject = prevProjects[index];
    const nextProject = nextProjects[index];

    if (!previousProject || !nextProject) return true;
    if (previousProject.slug !== nextProject.slug) return true;

    const previousExternalLink = previousProject.external_link?.cached_url ?? '';
    const nextExternalLink = nextProject.external_link?.cached_url ?? '';

    if (previousExternalLink !== nextExternalLink) return true;
  }

  return false;
};

const BlokHeadComponent = ({ projects }: Props) => {
  const headRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={headRef}
      className={`${styles.blokHead} blok blok-Head blok-AnimateHead`}
      data-active="true"
      data-forced-closed="false"
      data-scrollborder="false"
    >
      <GrainyGradient variant="blok" />
      <BlokHeadBehavior headRef={headRef} />
      <BlokHeadSidePanels />
      <BlokHeadRouteContentContainer projects={projects} />
    </div>
  );
};

const BlokHead = memo(
  BlokHeadComponent,
  (prevProps, nextProps) =>
    !haveProjectsChanged(prevProps.projects, nextProps.projects),
);

BlokHead.displayName = 'BlokHead';

export default BlokHead;
