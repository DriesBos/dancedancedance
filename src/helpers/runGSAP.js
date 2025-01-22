'use client';

import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

function RunGsap() {
  useGSAP(
    () => {
      gsap.set('.blok', {
        opacity: 0,
        y: 68,
      });
      gsap.to('.blok', {
        opacity: 1,
        y: 0,
        ease: 'power1.inOut',
        duration: 0.33,
        stagger: {
          amount: 0.66,
        },
      });
    },
    { revertOnUpdate: true }
  );

  return null;
}

export default RunGsap;
