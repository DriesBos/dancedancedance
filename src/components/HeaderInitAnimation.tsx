'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';

const HEADER_INIT_COMPLETE_ATTR = 'data-header-init-complete';

const getHeaderTargets = () =>
  Array.from(document.querySelectorAll<HTMLElement>('.blok-AnimateHead'));

const hasHeaderInitCompleted = () =>
  document.body?.getAttribute(HEADER_INIT_COMPLETE_ATTR) === 'true';

const markHeaderInitCompleted = () => {
  document.body?.setAttribute(HEADER_INIT_COMPLETE_ATTR, 'true');
};

export default function HeaderInitAnimation() {
  const hasAnimatedHeader = useRef(false);

  useGSAP(() => {
    if (hasAnimatedHeader.current || hasHeaderInitCompleted()) return;

    const headerTargets = getHeaderTargets();
    if (headerTargets.length === 0) return;

    markHeaderInitCompleted();

    gsap.set(headerTargets, {
      opacity: 0,
    });

    gsap.to(headerTargets, {
      opacity: 1,
      duration: 1,
      ease: 'expo.out',
      overwrite: 'auto',
    });

    hasAnimatedHeader.current = true;
  });

  return null;
}
