import type { HTMLAttributes } from 'react';
import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import { fetchProjectData } from '@/lib/fetch-projects';
import BlokProjectListClient from './BlokProjectListClient';

interface BlokProjectListProps {
  blok: SbBlokData;
}

export default async function BlokProjectList({ blok }: BlokProjectListProps) {
  const projects = await fetchProjectData();
  const editableProps =
    storyblokEditable(blok) as HTMLAttributes<HTMLDivElement>;

  return (
    <BlokProjectListClient projects={projects} editableProps={editableProps} />
  );
}
