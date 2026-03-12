'use client';

import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { useStore } from '@/store/store';

type PageContentGateProps = {
  children: ReactNode;
};

const visibleContentStyle: CSSProperties = {
  display: 'contents',
};

const hiddenContentStyle: CSSProperties = {
  visibility: 'hidden',
  pointerEvents: 'none',
};

export default function PageContentGate({
  children,
}: PageContentGateProps) {
  const pageContentVisible = useStore((state) => state.pageContentVisible);

  useEffect(() => {
    document.body?.setAttribute(
      'data-page-content-visible',
      pageContentVisible ? 'true' : 'false',
    );
  }, [pageContentVisible]);

  return (
    <div
      aria-hidden={pageContentVisible ? undefined : true}
      data-page-content-visible={pageContentVisible}
      style={pageContentVisible ? visibleContentStyle : hiddenContentStyle}
    >
      {children}
    </div>
  );
}
