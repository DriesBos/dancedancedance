import { apiPlugin, storyblokInit } from '@storyblok/react/rsc';

import BlokContainer from '@/components/storyblok/BlokContainer';
import ColumnImage from '@/components/storyblok/ColumnImage';
import ColumnText from '@/components/storyblok/ColumnText';
import ColumnEmpty from '@/components/storyblok/ColumnEmpty';
import Page from '@/components/storyblok/Page';
import Project from '@/components/storyblok/PageProject';
import ProjectList from '@/components/storyblok/BlokProjectList/BlokProjectList';

export const getStoryblokApi = storyblokInit({
  accessToken: process.env.NEXT_PUBLIC_STORYBLOK_TOKEN,
  components: {
    'Blok Container': BlokContainer,
    'Column Image': ColumnImage,
    'Column Text': ColumnText,
    'Column Empty': ColumnEmpty,
    Page: Page,
    'Page Project': Project,
    'Blok Project List': ProjectList,
  },
  use: [apiPlugin],
  apiOptions: {
    region: 'eu',
  },
});
