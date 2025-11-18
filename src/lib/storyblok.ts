import { apiPlugin, storyblokInit } from '@storyblok/react/rsc';

import Page from '@/components/storyblok/Page';
import Project from '@/components/storyblok/PageProject';
import BlokProjectList from '@/components/storyblok/BlokProjectList';
import BlokProjectSlider from '@/components/storyblok/BlokProjectSlider';
import BlokProjectImagesList from '@/components/storyblok/BlokProjectImagesList';
import BlokExperience from '@/components/storyblok/BlokExperience/BlokExperience';
import BlokContainer from '@/components/storyblok/BlokContainer';
import ColumnImage from '@/components/storyblok/ColumnImage';
import ColumnSlider from '@/components/storyblok/ColumnSlider';
import ColumnVideo from '@/components/storyblok/ColumnVideo';
import ColumnText from '@/components/storyblok/ColumnText';
import ColumnTextExpandable from '@/components/storyblok/ColumnTextExpandable';
import ColumnEmpty from '@/components/storyblok/ColumnEmpty';

export const getStoryblokApi = storyblokInit({
  accessToken: process.env.NEXT_PUBLIC_STORYBLOK_TOKEN,
  components: {
    Page: Page,
    'Page Project': Project,
    'Blok Project List': BlokProjectList,
    'Blok Project Slider': BlokProjectSlider,
    'Blok Project Images List': BlokProjectImagesList,
    'Blok Experience': BlokExperience,
    'Blok Container': BlokContainer,
    'Column Image': ColumnImage,
    'Column Slider': ColumnSlider,
    'Column Video': ColumnVideo,
    'Column Text': ColumnText,
    'Column Text Expandable': ColumnTextExpandable,
    'Column Empty': ColumnEmpty,
  },
  use: [apiPlugin],
  apiOptions: {
    region: 'eu',
    cache: {
      type: 'memory',
    },
  },
});
