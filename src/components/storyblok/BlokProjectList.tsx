import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import BlokProject from '../BlokProject';
import { fetchProjectData } from './projectsData';
import GrainyGradient from '../GrainyGradient';
import BlokSidePanels from '../BlokSidePanels';

interface BlokProjectListProps {
  blok: SbBlokData;
}

export default async function BlokProjectList({ blok }: BlokProjectListProps) {
  const data = await fetchProjectData();

  return (
    <div className="blok blok-ProjectList" {...storyblokEditable(blok)}>
      <GrainyGradient variant="blok" />
      <BlokSidePanels />
      {data.map((item) => (
        <BlokProject
          key={item.slug}
          slug={item.slug}
          year={item.year}
          title={item.title}
          category={item.category}
          external_link={item.external_link}
        />
      ))}
    </div>
  );
}
