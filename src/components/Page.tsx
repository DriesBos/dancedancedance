import { storyblokEditable, StoryblokComponent } from '@storyblok/react/rsc';

interface Props {
  blok: any;
}

const Page = ({ blok }: Props) => (
  <>
    {blok.body.map((nestedBlok: any) => (
      <StoryblokComponent blok={nestedBlok} key={nestedBlok._uid} />
    ))}
  </>
);

export default Page;
