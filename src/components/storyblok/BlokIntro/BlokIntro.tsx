import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import BlokSidePanels from '@/components/BlokSidePanels';
import GrainyGradient from '@/components/GrainyGradient';
import styles from './BlokIntro.module.sass';

interface SbBlokIntroData extends SbBlokData {
  line_one?: string;
  line_two?: string;
  line_combined?: string;
}

interface BlokIntroProps {
  blok: SbBlokIntroData;
}

const BlokIntro = ({ blok }: BlokIntroProps) => {
  return (
    <div
      className={`blok blok-Intro blok-Animate ${styles.blokIntro}`}
      {...storyblokEditable(blok)}
    >
      <GrainyGradient variant="blok" />
      <BlokSidePanels />

      <div className={styles.copy}>
        {blok.line_one ? (
          <p className={`${styles.lineOne} desktop`}>{blok.line_one}</p>
        ) : null}
        {blok.line_two ? (
          <p className={`${styles.lineTwo} desktop`}>{blok.line_two}</p>
        ) : null}
        {blok.line_combined ? (
          <p className={`${styles.lineCombined} mobile`}>{blok.line_combined}</p>
        ) : null}
      </div>
    </div>
  );
};

export default BlokIntro;
