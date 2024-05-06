/** 1. Tag it as a client component */
'use client';
import { storyblokInit, apiPlugin } from '@storyblok/react/rsc';
import components from './index';

/** 2. Initialize it as usual */
storyblokInit({
  accessToken: process.env.DB_STORYBLOK_PREVIEW,
  use: [apiPlugin],
  components,
  apiOptions: {
    region: 'eu',
  },
});

export default function StoryblokProvider({ children }) {
  return children;
}
