'use client';

import { useRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { useMarkdownLinkAnimations } from '@/components/TheMarkdown/useMarkdownLinkAnimations';

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
  useMarkdownLinkAnimations(container);

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
