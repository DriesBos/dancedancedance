import { StoryblokComponent } from '@storyblok/react/rsc';

interface Props {
  blok?: any;
}

const Project = ({ blok }: Props) => {
  return (
    <>
      {blok.body.map((nestedBlok: any) => (
        <StoryblokComponent blok={nestedBlok} key={nestedBlok._uid} />
      ))}
    </>
  );
};

export default Project;
