'use client';

import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useEffect } from 'react';

gsap.registerPlugin(useGSAP);

function RunGsap() {
  useGSAP(() => {
    gsap.to('.blok', {
      opacity: 1,
      y: 0,
      ease: 'power1.inOut',
      duration: 0.33,
      // delay: 10,
      stagger: {
        amount: 1,
      },
    });
  });

  return null;
}

export default RunGsap;
