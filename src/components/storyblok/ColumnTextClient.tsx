'use client';

import { useRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';

interface ColumnTextClientProps {
  children: ReactNode;
  color?: 'primary' | 'secondary';
  display?: 'all' | 'desktop' | 'mobile';
  editableAttributes?: HTMLAttributes<HTMLDivElement>;
}

const ColumnTextClient = ({
  children,
  color,
  display,
  editableAttributes,
}: ColumnTextClientProps) => {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!container.current) return;

      gsap.to(container.current, {
        '--var': '100%',
        duration: 0.66,
        delay: 0.33,
        ease: 'ease',
      });
    },
    { scope: container },
  );

  return (
    <div
      className="column column-Text"
      data-display={display}
      data-color={color}
      ref={container}
      {...editableAttributes}
    >
      {children}
    </div>
  );
};

export default ColumnTextClient;
