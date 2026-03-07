import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import { fetchProjectData } from './projectsData';
import BlokProjectListClient from './BlokProjectListClient';
import BlokAction from '../BlokAction';

interface BlokProjectListProps {
  blok: SbBlokData;
}

export default async function BlokProjectList({ blok }: BlokProjectListProps) {
  const projects = await fetchProjectData();

  return (
    <div className="blok blok-ProjectList" {...storyblokEditable(blok)}>
      <BlokProjectListClient projects={projects} />
      <BlokAction />
    </div>
  );
}
