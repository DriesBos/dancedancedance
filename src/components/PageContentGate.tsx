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
    const body = document.body;
    const visibilityValue = pageContentVisible ? 'true' : 'false';

    body?.setAttribute('data-page-content-visible', visibilityValue);
    const html = document.documentElement;

    if (!body || !html) {
      return;
    }

    if (!pageContentVisible) {
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
      return;
    }

    html.style.overflow = '';
    body.style.overflow = '';
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
