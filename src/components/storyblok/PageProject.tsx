import {
  SbBlokData,
  storyblokEditable,
  StoryblokServerComponent,
} from '@storyblok/react/rsc';
import GrainyGradient from '@/components/GrainyGradient';

interface SbPageProjectData extends SbBlokData {
  body: SbBlokData[];
  title?: string;
}

interface ProjectProps {
  blok: SbPageProjectData;
}

const PageProject = ({ blok }: ProjectProps) => {
  return (
    <div className="page page-Project" {...storyblokEditable(blok)}>
      <GrainyGradient variant="page" />
      {blok.body.map((nestedBlok: any) => (
        <StoryblokServerComponent blok={nestedBlok} key={nestedBlok._uid} />
      ))}
    </div>
  );
};

export default PageProject;
