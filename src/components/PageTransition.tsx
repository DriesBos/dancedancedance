'use client';

import { useLayoutEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { gsap, useGSAP } from '@/lib/gsap';
import { useStore } from '@/store/store';

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const BLOCK_DURATION = 0.33;
  const BLOCK_STAGGER = 0.165;
  const PROJECT_SPEED_MULTIPLIER = 2;
  const pathname = usePathname();
  const pageContentVisible = useStore((state) => state.pageContentVisible);
  const pageContentRevealKey = useStore((state) => state.pageContentRevealKey);
  const hasAnimatedHeader = useRef(false);
  const getHeaderTargets = () =>
    Array.from(document.querySelectorAll<HTMLElement>('.blok-AnimateHead'));
  const getBlockTargets = () =>
    Array.from(document.querySelectorAll<HTMLElement>('.blok-Animate'));

  // Force top on every client-side route change.
  useLayoutEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  // Animate header only on initial load
  useGSAP(() => {
    if (!pageContentVisible || hasAnimatedHeader.current) return;

    const headerTargets = getHeaderTargets();
    if (headerTargets.length === 0) {
      hasAnimatedHeader.current = true;
      return;
    }

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
  }, [pageContentVisible]);

  useGSAP(
    () => {
      if (!pageContentVisible) return;

      const blockTargets = getBlockTargets();
      if (blockTargets.length === 0) return;

      gsap.set(blockTargets, {
        opacity: 0,
        y: 20,
      });

      // Keep DOM-order sequence, but animate .blok-Project entries at 2x speed.
      const timeline = gsap.timeline({
        defaults: {
          opacity: 1,
          y: 0,
          ease: 'power1.inOut',
          overwrite: 'auto',
        },
      });

      let offset = 0;
      blockTargets.forEach((target) => {
        const isProject = target.classList.contains('blok-Project');
        const speed = isProject ? PROJECT_SPEED_MULTIPLIER : 1;
        const duration = BLOCK_DURATION / speed;
        const gap = BLOCK_STAGGER / speed;

        timeline.to(target, { duration }, offset);
        offset += gap;
      });
    },
    {
      dependencies: [pathname, pageContentRevealKey, pageContentVisible],
      revertOnUpdate: true,
    }
  ); // Re-run animation on route change

  return <>{children}</>;
}
