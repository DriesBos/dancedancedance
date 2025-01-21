'use client';

import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

function RunLaser() {
  useGSAP(
    () => {
      gsap.set('.laserBlok-Line', {
        width: 0,
        height: 0,
        opacity: 0,
      });
      gsap.to('.laserBlok-Line', {
        opacity: 1,
        duration: 0,
        ease: 'none',
      });
      gsap.to('.laserBlok-Line', {
        width: '105vw',
        height: '105vh',
        duration: 0.66,
        ease: 'expo.out',
      });
    },
    { revertOnUpdate: true }
  );

  return null;
}

export default RunLaser;
