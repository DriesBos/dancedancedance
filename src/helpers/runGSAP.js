'use client';

import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

function RunGsap() {
  useGSAP(() => {
    gsap.to('.blok', {
      opacity: 1,
      y: 0,
      ease: 'power1.inOut',
      duration: 0.33,
      stagger: {
        amount: 0.165,
      },
    });
  });

  useGSAP(() => {
    gsap.to('.animateModule', {
      opacity: 1,
      y: 0,
      ease: 'power1.inOut',

      duration: 0.66,
      stagger: {
        amount: 0.33,
      },
    });
  });

  useGSAP(() => {
    gsap.to('.animateToken', {
      opacity: 1,
      y: 0,
      ease: 'power1.inOut',
      duration: 1,
      stagger: {
        amount: 0.165,
      },
    });
  });

  return null;
}

export default RunGsap;
