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
    if (!hasAnimatedHeader.current) {
      gsap.set('.blok-AnimateHead', {
        opacity: 0,
        // y: 68,
      });

      gsap.to('.blok-AnimateHead', {
        opacity: 1,
        // y: 0,
        duration: 0.33,
        ease: 'power1.inOut',
      });

      hasAnimatedHeader.current = true;
    }
  }, []); // Empty dependency array = run once on mount

  useGSAP(
    () => {
      // Set initial state for all animated blocks
      gsap.set('.blok-Animate', {
        opacity: 0,
        y: 20,
      });

      // Animate in with stagger - faster duration for snappier feel
      gsap.to('.blok-Animate', {
        opacity: 1,
        y: 0,
        duration: 0.33,
        stagger: 0.165,
        ease: 'power1.inOut',
      });
    },
    { dependencies: [pathname], revertOnUpdate: true }
  ); // Re-run animation on route change

  return <>{children}</>;
}
