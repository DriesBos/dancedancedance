import { storyblokEditable, StoryblokComponent } from '@storyblok/react/rsc';

const Project = ({ blok }) => (
  <main {...storyblokEditable(blok)}>
    <h1>PROJECT COMPONENT</h1>
    {blok.body.map((nestedBlok) => (
      <StoryblokComponent blok={nestedBlok} key={nestedBlok._uid} />
    ))}
  </main>
);

export default Project;
