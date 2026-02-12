'use client';

import { useEffect } from 'react';
import { initStoryblokClient } from '@/lib/storyblok-client';

export default function StoryblokProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    initStoryblokClient();
  }, []);

  return children;
}
