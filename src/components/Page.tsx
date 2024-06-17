import { StoryblokComponent } from '@storyblok/react/rsc';

interface Props {
  blok?: any;
}

const Page = ({ blok }: Props) => {
  return (
    <>
      <p>PAGE COMPONENT</p>
      {blok.body.map((nestedBlok: any) => (
        <StoryblokComponent blok={nestedBlok} key={nestedBlok._uid} />
      ))}
    </>
  );
};

export default Page;
