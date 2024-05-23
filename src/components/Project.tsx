import { storyblokEditable, StoryblokComponent } from '@storyblok/react/rsc';

interface Props {
  blok: any;
}

const Project = ({ blok }: Props) => (
  <main {...storyblokEditable(blok)}>
    <h1>PROJECT</h1>
    {blok.body.map(
      (
        nestedBlok: any // Explicitly define the type of 'nestedBlok' as 'any'
      ) => (
        <StoryblokComponent blok={nestedBlok} key={nestedBlok._uid} />
      )
    )}
  </main>
);

export default Project;
