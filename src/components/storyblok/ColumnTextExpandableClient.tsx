'use client';

import { useRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';

interface ColumnTextExpandableClientProps {
  text?: ReactNode;
  more?: ReactNode;
  details?: ReactNode;
  editableAttributes?: HTMLAttributes<HTMLDivElement>;
}

const ColumnTextExpandableClient = ({
  text,
  more,
  details,
  editableAttributes,
}: ColumnTextExpandableClientProps) => {
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
      className="column column-Text column-TextExpandable"
      ref={container}
      {...editableAttributes}
    >
      {text ? <div className="column-TextExpandable-Main">{text}</div> : null}
      {more ? <div className="column-TextExpandable-More">{more}</div> : null}
      {details ? <div className="column-TextExpandable-Details">{details}</div> : null}
    </div>
  );
};

export default ColumnTextExpandableClient;
