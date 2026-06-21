'use client';

import type { RefObject } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';

export const useMarkdownLinkAnimations = <TElement extends HTMLElement>(
  container: RefObject<TElement | null>,
) => {
  useGSAP(
    () => {
      if (!container.current) return;

      const links = container.current.querySelectorAll<HTMLElement>('.markdown a');
      if (links.length === 0) return;

      gsap.set(links, {
        '--markdown-underline-progress': '0%',
      });

      gsap.to(links, {
        '--markdown-underline-progress': '100%',
        duration: 0.66,
        delay: 0.33,
        ease: 'ease',
        stagger: 0.045,
      });
    },
    { scope: container },
  );
};
