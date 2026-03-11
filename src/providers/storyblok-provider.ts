'use client';

import { useEffect } from 'react';
import { initStoryblokClient } from '@/lib/storyblok-client';

export default function StoryblokProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const isLivePreviewRoute = window.location.pathname.startsWith(
      '/live-preview',
    );
    const hasStoryblokBridgeToken =
      searchParams.has('_storyblok') || searchParams.has('_storyblok_tk');
    let isEmbedded = false;

    try {
      isEmbedded = window.self !== window.top;
    } catch {
      // Cross-origin iframes can throw on `window.top` access.
      isEmbedded = true;
    }

    if (!isLivePreviewRoute && !hasStoryblokBridgeToken && !isEmbedded) {
      return;
    }

    initStoryblokClient();
  }, []);

  return children;
}
