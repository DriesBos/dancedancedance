import type { HTMLAttributes } from 'react';
import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import { fetchProjectData } from './projectsData';
import BlokProjectListClient from './BlokProjectListClient';
import { DEFAULT_LOCALE } from '@/lib/locale';

interface BlokProjectListProps {
  blok: SbBlokData;
}

export default async function BlokProjectList({ blok }: BlokProjectListProps) {
  const projects = await fetchProjectData();
  const locale = DEFAULT_LOCALE;
  const editableProps =
    storyblokEditable(blok) as HTMLAttributes<HTMLDivElement>;

  return (
    <BlokProjectListClient
      projects={projects}
      editableProps={editableProps}
      locale={locale}
    />
  );
}
