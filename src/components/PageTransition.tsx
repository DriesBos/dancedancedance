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
  const pageContentVisible = useStore((state) => state.pageContentVisible);
  const pageContentRevealKey = useStore((state) => state.pageContentRevealKey);
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

  useGSAP(
    () => {
      if (!pageContentVisible) return;

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
      dependencies: [pathname, theme, pageContentRevealKey, pageContentVisible],
      revertOnUpdate: true,
    }
  ); // Re-run animation on route and theme change

  return <>{children}</>;
}
