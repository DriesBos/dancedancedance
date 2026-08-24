'use client';

import { useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { gsap, useGSAP } from '@/lib/gsap';
import { useStore } from '@/store/store';

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const theme = useStore((state) => state.theme);
  const getBlockTargets = () =>
    Array.from(document.querySelectorAll<HTMLElement>('.blok-Animate'));
  const getBlockContentTargets = (block: HTMLElement) =>
    Array.from(
      block.querySelectorAll<HTMLElement>(
        block.matches('.blok-ProjectList')
          ? ':scope > .blok-Project > :not(.side_Top):not(.grainyGradient)'
          : ':scope > :not(.side_Top):not(.grainyGradient)',
      ),
    );

  // Force top on every client-side route change.
  useLayoutEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  useGSAP(
    () => {
      const blockTargets = getBlockTargets();
      if (blockTargets.length === 0) return;
      const contentTargets = blockTargets.map(getBlockContentTargets);

      gsap.set(blockTargets, {
        opacity: 1,
        y: '5vh',
      });
      contentTargets.forEach((targets) => gsap.set(targets, { opacity: 0 }));

      gsap.to(blockTargets, {
        y: 0,
        duration: 1,
        ease: 'expo.out',
        overwrite: 'auto',
        stagger: 0.15,
      });
      contentTargets.forEach((targets, index) =>
        gsap.to(targets, {
          opacity: 1,
          duration: 1,
          delay: index * 0.15,
          ease: 'expo.out',
          overwrite: 'auto',
          clearProps: 'opacity',
        }),
      );
    },
    {
      dependencies: [pathname, theme],
      revertOnUpdate: true,
    }
  ); // Re-run animation on route and theme change

  return <>{children}</>;
}
