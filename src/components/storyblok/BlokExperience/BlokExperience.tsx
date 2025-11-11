import styles from './BlokExperience.module.sass';
import { SbBlokData } from '@storyblok/react/rsc';
import BlokSidePanels from '../../BlokSides';
import Row from '@/components/Row';

interface SbPageData extends SbBlokData {
  body: SbBlokData[];
}

interface BlokProps {
  blok: SbPageData;
}

const BlokExperience = ({ blok }: BlokProps) => {
  return (
    <div className={`blok blok-Exp blok-Animate`}>
      <div className={styles.blokName}>Experience</div>
      <div className={styles.content}>
        <div className={styles.row}>
          <div className={styles.rowItem}>
            <span className={styles.rowPeriod}>2025 — Present</span>
          </div>
          <div className={styles.rowItem}>
            <span className={styles.rowName}>Dries Bos Studio</span>
            <span className={styles.rowRole}>Freelance</span>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.rowItem}>
            <span className={styles.rowPeriod}>2022 — 2025</span>
          </div>
          <div className={styles.rowItem}>
            <span className={styles.rowName}>Mmerch</span>
            <span className={styles.rowRole}>Senior Frontend Developer</span>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.rowItem}>
            <span className={styles.rowPeriod}>2020 — 2022</span>
          </div>
          <div className={styles.rowItem}>
            <span className={styles.rowName}>Anatha</span>
            <span className={styles.rowRole}>Lead UX Design</span>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.rowItem}>
            <span className={styles.rowPeriod}>2017 — 2019</span>
          </div>
          <div className={styles.rowItem}>
            <span className={styles.rowName}>Fotomat</span>
            <span className={styles.rowRole}>Frontend Developer</span>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.rowItem}>
            <span className={styles.rowPeriod}>2011 — 2015</span>
          </div>
          <div className={styles.rowItem}>
            <span className={styles.rowName}>Close My Eyes</span>
            <span className={styles.rowRole}>Frontend Developer + Founder</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlokExperience;
