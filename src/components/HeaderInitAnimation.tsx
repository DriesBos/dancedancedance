'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';

const HEADER_INIT_COMPLETE_ATTR = 'data-header-init-complete';
const HEADER_INTRO_VISIBLE_ATTR = 'data-header-intro-visible';

const getHeaderTargets = () =>
  Array.from(document.querySelectorAll<HTMLElement>('.blok-AnimateHead'));
const getHeaderContentTargets = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>(
      '.blok-AnimateHead > div > :not(.side_Top):not(.grainyGradient)',
    ),
  );

const hasHeaderInitCompleted = () =>
  document.body?.getAttribute(HEADER_INIT_COMPLETE_ATTR) === 'true';

const markHeaderInitCompleted = () => {
  document.body?.setAttribute(HEADER_INIT_COMPLETE_ATTR, 'true');
};

const markHeaderIntroVisible = () => {
  document.body?.setAttribute(HEADER_INTRO_VISIBLE_ATTR, 'true');
};

export default function HeaderInitAnimation() {
  const hasAnimatedHeader = useRef(false);

  useGSAP(() => {
    const headerTargets = getHeaderTargets();
    if (headerTargets.length === 0) return;
    const headerContentTargets = getHeaderContentTargets();

    if (hasAnimatedHeader.current || hasHeaderInitCompleted()) {
      gsap.set(headerTargets, { opacity: 1 });
      gsap.set(headerContentTargets, { opacity: 1 });
      markHeaderIntroVisible();
      return;
    }

    gsap.set(headerTargets, { opacity: 1 });
    gsap.set(headerContentTargets, { opacity: 0 });

    const completeHeaderIntro = () => {
      hasAnimatedHeader.current = true;
      markHeaderInitCompleted();
      markHeaderIntroVisible();
    };

    gsap.to(headerContentTargets, {
      opacity: 1,
      duration: 1,
      ease: 'expo.out',
      overwrite: 'auto',
      clearProps: 'opacity',
      onComplete: completeHeaderIntro,
    });
  });

  return null;
}
