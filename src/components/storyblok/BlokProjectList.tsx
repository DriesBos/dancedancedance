import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import { fetchProjectData } from './projectsData';
import BlokProjectListClient from './BlokProjectListClient';

interface BlokProjectListProps {
  blok: SbBlokData;
}

export default async function BlokProjectList({ blok }: BlokProjectListProps) {
  const projects = await fetchProjectData();

  return (
    <div className="blok blok-ProjectList" {...storyblokEditable(blok)}>
      <BlokProjectListClient projects={projects} />
    </div>
  );
}
