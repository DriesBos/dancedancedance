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

  // Force top on every client-side route change.
  useLayoutEffect(() => {
    const html = document.documentElement;
    const scrollBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    html.getClientRects();
    window.scrollTo(0, 0);
    html.style.scrollBehavior = scrollBehavior;
  }, [pathname]);

  useGSAP(
    () => {
      const blockTargets = getBlockTargets();
      if (blockTargets.length === 0) return;

      gsap.set(blockTargets, {
        opacity: 0,
        y: '5vh',
      });

      gsap.to(blockTargets, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'expo.out',
        overwrite: 'auto',
        stagger: 0.15,
      });
    },
    {
      dependencies: [pathname, theme],
      revertOnUpdate: true,
    }
  ); // Re-run animation on route and theme change

  return <>{children}</>;
}
