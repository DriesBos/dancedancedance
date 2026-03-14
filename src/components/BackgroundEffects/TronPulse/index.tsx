'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from '@/lib/gsap';
import styles from './TronPulse.module.sass';

const ROUTE_PULSE_DURATION_SECONDS = 0.66;

const getBorderWidthPx = (element: HTMLElement) => {
  const rawBorderWidth = getComputedStyle(element)
    .getPropertyValue('--border-width')
    .trim();
  const borderWidth = Number.parseFloat(rawBorderWidth);

  return Number.isFinite(borderWidth) ? borderWidth : 0;
};

export default function TronPulse() {
  const pathname = usePathname();
  const frameRef = useRef<HTMLDivElement>(null);
  const hasSeenPathnameRef = useRef(false);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    if (!hasSeenPathnameRef.current) {
      hasSeenPathnameRef.current = true;
      gsap.set(frame, { autoAlpha: 0, width: 0, height: 0 });
      return;
    }

    const borderWidth = getBorderWidthPx(frame);
    const targetWidthPx = window.innerWidth * 1.01;
    const targetHeightPx = window.innerHeight * 1.01;

    gsap.killTweensOf(frame);
    gsap.set(frame, {
      autoAlpha: 1,
      width: 0,
      height: 0,
    });

    gsap.to(frame, {
      width: targetWidthPx,
      height: targetHeightPx,
      duration: ROUTE_PULSE_DURATION_SECONDS,
      ease: 'cine.out',
      onComplete: () => {
        gsap.set(frame, {
          autoAlpha: 0,
          width: 0,
          height: 0,
        });
      },
    });
  }, [pathname]);

  return (
    <div className={styles.root} aria-hidden="true">
      <div ref={frameRef} className={styles.frame} />
    </div>
  );
}
