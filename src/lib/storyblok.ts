import { apiPlugin, storyblokInit } from '@storyblok/react/rsc';

import Blok from '@/components/storyblok/Blok';
import ColumnImage from '@/components/storyblok/ColumnImage';
import ColumnText from '@/components/storyblok/ColumnText';
import ColumnEmpty from '@/components/storyblok/ColumnEmpty';
import Page from '@/components/storyblok/Page';
import Project from '@/components/storyblok/Project';

export const getStoryblokApi = storyblokInit({
  accessToken: process.env.NEXT_PUBLIC_STORYBLOK_TOKEN,
  components: {
    blok: Blok,
    columnimage: ColumnImage,
    columntext: ColumnText,
    columnempty: ColumnEmpty,
    page: Page,
    project: Project,
  },
  use: [apiPlugin],
  apiOptions: {
    region: 'eu',
  },
});
