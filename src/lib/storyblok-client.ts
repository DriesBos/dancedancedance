'use client';

import { apiPlugin, storyblokInit } from '@storyblok/react/rsc';

let hasInitializedStoryblokClient = false;

export const initStoryblokClient = () => {
  if (hasInitializedStoryblokClient) return;

  const accessToken =
    process.env.NEXT_PUBLIC_STORYBLOK_PREVIEW_ACCESS_TOKEN ||
    process.env.NEXT_PUBLIC_STORYBLOCK_PREVIEW_ACCESS_TOKEN ||
    process.env.NEXT_PUBLIC_STORYBLOK_TOKEN;

  if (!accessToken) return;

  storyblokInit({
    accessToken,
    use: [apiPlugin],
    enableFallbackComponent: true,
  });

  hasInitializedStoryblokClient = true;
};
