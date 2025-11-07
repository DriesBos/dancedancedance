import { apiPlugin, storyblokInit } from '@storyblok/react/rsc';

import BlokContainer from '@/components/storyblok/BlokContainer';
import ColumnImage from '@/components/storyblok/ColumnImage';
import ColumnText from '@/components/storyblok/ColumnText';
import ColumnEmpty from '@/components/storyblok/ColumnEmpty';
import Page from '@/components/storyblok/Page';
import Project from '@/components/storyblok/PageProject';
import BlokProjectList from '@/components/storyblok/BlokProjectList';
import BlokProjectSlider from '@/components/storyblok/BlokProjectSlider';
import BlokProjectImagesList from '@/components/storyblok/BlokProjectImagesList';

export const getStoryblokApi = storyblokInit({
  accessToken: process.env.NEXT_PUBLIC_STORYBLOK_TOKEN,
  components: {
    'Blok Container': BlokContainer,
    'Column Image': ColumnImage,
    'Column Text': ColumnText,
    'Column Empty': ColumnEmpty,
    Page: Page,
    'Page Project': Project,
    'Blok Project List': BlokProjectList,
    'Blok Project Images List': BlokProjectImagesList,
    'Blok Project Slider': BlokProjectSlider,
  },
  use: [apiPlugin],
  apiOptions: {
    region: 'eu',
  },
});
