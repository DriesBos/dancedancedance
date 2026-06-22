import styles from './BlokExperience.module.sass';
import {
  SbBlokData,
  storyblokEditable,
  StoryblokServerComponent,
} from '@storyblok/react/rsc';
import BlokSidePanels from '../../BlokSidePanels';
import GrainyGradient from '@/components/GrainyGradient';

interface SbPageData extends SbBlokData {
  body?: SbBlokData[];
}

interface BlokProps {
  blok: SbPageData;
}

const BlokExperience = ({ blok }: BlokProps) => {
  const body = Array.isArray(blok.body) ? blok.body : [];

  return (
    <div className="blok blok-Exp blok-Animate" {...storyblokEditable(blok)}>
      <GrainyGradient variant="blok" />
      <BlokSidePanels />
      <div className={styles.blokName}>
        <h2>Experience</h2>
      </div>
      <div className={styles.content}>
        {body.map((nestedBlok) => (
          <StoryblokServerComponent blok={nestedBlok} key={nestedBlok._uid} />
        ))}
      </div>
    </div>
  );
};

export default BlokExperience;
