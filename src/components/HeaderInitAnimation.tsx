'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { useStore } from '@/store/store';

let hasAnimatedHeaderOnce = false;

const getHeaderTargets = () =>
  Array.from(document.querySelectorAll<HTMLElement>('.blok-AnimateHead'));

export default function HeaderInitAnimation() {
  const pageContentVisible = useStore((state) => state.pageContentVisible);
  const hasAnimatedHeader = useRef(hasAnimatedHeaderOnce);

  useGSAP(() => {
    if (!pageContentVisible) return;
    if (hasAnimatedHeader.current || hasAnimatedHeaderOnce) return;

    const headerTargets = getHeaderTargets();
    if (headerTargets.length === 0) return;

    gsap.set(headerTargets, {
      opacity: 0,
    });

    gsap.to(headerTargets, {
      opacity: 1,
      duration: 0.33,
      ease: 'power1.inOut',
      overwrite: 'auto',
    });

    hasAnimatedHeader.current = true;
    hasAnimatedHeaderOnce = true;
  }, [pageContentVisible]);

  return null;
}
