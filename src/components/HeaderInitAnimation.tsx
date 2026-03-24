'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { useStore } from '@/store/store';

const HEADER_INIT_COMPLETE_ATTR = 'data-header-init-complete';

const getHeaderTargets = () =>
  Array.from(document.querySelectorAll<HTMLElement>('.blok-AnimateHead'));

const hasHeaderInitCompleted = () =>
  document.body?.getAttribute(HEADER_INIT_COMPLETE_ATTR) === 'true';

const markHeaderInitCompleted = () => {
  document.body?.setAttribute(HEADER_INIT_COMPLETE_ATTR, 'true');
};

export default function HeaderInitAnimation() {
  const pageContentVisible = useStore((state) => state.pageContentVisible);
  const hasAnimatedHeader = useRef(false);

  useGSAP(() => {
    if (!pageContentVisible) return;
    if (hasAnimatedHeader.current || hasHeaderInitCompleted()) return;

    const headerTargets = getHeaderTargets();
    if (headerTargets.length === 0) return;

    markHeaderInitCompleted();

    gsap.set(headerTargets, {
        opacity: 0,
        y: '5vh',
    });

    gsap.to(headerTargets, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'expo.out',
        overwrite: 'auto',
    });

    hasAnimatedHeader.current = true;
  }, [pageContentVisible]);

  return null;
}
