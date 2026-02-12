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
import BlokBlurb from '@/components/storyblok/BlokBlurb';
import PageBlurbs from '@/components/storyblok/PageBlurbs';

const components = {
  Page: Page,
  'Page Blurbs': PageBlurbs,
  'Page Project': Project,
  'Blok Project List': BlokProjectList,
  'Blok Project Slider': BlokProjectSlider,
  'Blok Project Images List': BlokProjectImagesList,
  'Blok Experience': BlokExperience,
  'Blok Container': BlokContainer,
  'Blok Blurp': BlokBlurb,
  'Column Image': ColumnImage,
  'Column Slider': ColumnSlider,
  'Column Video': ColumnVideo,
  'Column Text': ColumnText,
  'Column Text Expandable': ColumnTextExpandable,
  'Column Empty': ColumnEmpty,
};

export const getStoryblokAccessToken = (preview = false): string | undefined => {
  const publicToken =
    process.env.STORYBLOK_PUBLIC_ACCESS_TOKEN ||
    process.env.NEXT_PUBLIC_STORYBLOK_TOKEN;
  const previewToken =
    process.env.STORYBLOK_PREVIEW_ACCESS_TOKEN ||
    process.env.NEXT_PREVIEW_STORYBLOK_TOKEN;

  return preview ? previewToken || publicToken : publicToken;
};

export const getStoryblokApi = (preview = false) => {
  const accessToken = getStoryblokAccessToken(preview);
  if (!accessToken) {
    throw new Error(
      'Missing Storyblok token. Set STORYBLOK_PUBLIC_ACCESS_TOKEN (or NEXT_PUBLIC_STORYBLOK_TOKEN).'
    );
  }

  return storyblokInit({
    accessToken,
    components: {
      ...components,
    },
    use: [apiPlugin],
    apiOptions: {
      region: 'eu',
      cache: {
        type: 'memory',
      },
    },
  })();
};
