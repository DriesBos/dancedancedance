import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import BlokSidePanels from '@/components/BlokSidePanels';
import GrainyGradient from '@/components/GrainyGradient';
import InlineWordSwapText from '@/components/InlineWordSwapText';
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
          <p className={`${styles.line} ${styles.lineOne} desktop`}>
            <InlineWordSwapText text={blok.line_one} keyPrefix="line-one" />
          </p>
        ) : null}
        {blok.line_two ? (
          <p className={`${styles.line} ${styles.lineTwo} desktop`}>
            <InlineWordSwapText text={blok.line_two} keyPrefix="line-two" />
          </p>
        ) : null}
        {blok.line_combined ? (
          <p className={`${styles.line} ${styles.lineCombined} mobile`}>
            <InlineWordSwapText text={blok.line_combined} keyPrefix="line-combined" />
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default BlokIntro;
