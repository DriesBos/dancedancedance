'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const hasAnimatedHeader = useRef(false);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
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

  useGSAP(() => {
    // Set initial state for all animated blocks
    gsap.set('.blok-Animate', {
      opacity: 0,
      // y: 68,
    });

    // Animate in with stagger
    gsap.to('.blok-Animate', {
      opacity: 1,
      // y: 0,
      duration: 0.33,
      stagger: 0.165,
      ease: 'power1.inOut',
    });
  }, [pathname]); // Re-run animation on route change

  return <>{children}</>;
}
