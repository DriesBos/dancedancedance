import type { HTMLAttributes } from 'react';
import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import { fetchProjectData } from './projectsData';
import BlokProjectListClient from './BlokProjectListClient';
// import BlokAction from '../BlokAction';

interface BlokProjectListProps {
  blok: SbBlokData;
}

export default async function BlokProjectList({ blok }: BlokProjectListProps) {
  const projects = await fetchProjectData();
  const editableProps =
    storyblokEditable(blok) as HTMLAttributes<HTMLDivElement>;

  return <BlokProjectListClient projects={projects} editableProps={editableProps} />;
}
