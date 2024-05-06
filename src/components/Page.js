import { storyblokEditable, StoryblokComponent } from '@storyblok/react/rsc';

const Page = ({ blok }) => (
  <main {...storyblokEditable(blok)}>
    <p>PAGE COMPONENT</p>
    {blok.body.map((nestedBlok) => (
      <StoryblokComponent blok={nestedBlok} key={nestedBlok._uid} />
    ))}
  </main>
);

export default Page;
