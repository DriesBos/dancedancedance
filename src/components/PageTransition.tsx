'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { gsap, useGSAP } from '@/lib/gsap';

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const hasAnimatedHeader = useRef(false);
  const getHeaderTargets = () =>
    Array.from(document.querySelectorAll<HTMLElement>('.blok-AnimateHead'));
  const getBlockTargets = () =>
    Array.from(document.querySelectorAll<HTMLElement>('.blok-Animate'));
  const prefersReducedMotion = () =>
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll to top on route change - instant, no smooth behavior
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  // Animate header only on initial load
  useGSAP(() => {
    if (hasAnimatedHeader.current) return;

    const headerTargets = getHeaderTargets();
    if (headerTargets.length === 0) {
      hasAnimatedHeader.current = true;
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(headerTargets, { opacity: 1, y: 0 });
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
  }, []); // Empty dependency array = run once on mount

  useGSAP(
    () => {
      const blockTargets = getBlockTargets();
      if (blockTargets.length === 0) return;

      if (prefersReducedMotion()) {
        gsap.set(blockTargets, { opacity: 1, y: 0 });
        return;
      }

      gsap.set(blockTargets, {
        opacity: 0,
        y: 20,
      });

      // Animate in with stagger - faster duration for snappier feel
      gsap.to(blockTargets, {
        opacity: 1,
        y: 0,
        duration: 0.33,
        stagger: 0.165,
        ease: 'power1.inOut',
        overwrite: 'auto',
      });
    },
    { dependencies: [pathname], revertOnUpdate: true }
  ); // Re-run animation on route change

  return <>{children}</>;
}
