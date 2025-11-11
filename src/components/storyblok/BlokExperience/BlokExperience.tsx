import styles from './BlokExperience.module.sass';
import { SbBlokData } from '@storyblok/react/rsc';
import BlokSidePanels from '../../BlokSides';

interface SbPageData extends SbBlokData {
  body: SbBlokData[];
}

interface BlokProps {
  blok: SbPageData;
}

const BlokExperience = ({ blok }: BlokProps) => {
  return (
    <div className="blok-Exp blok-Animate">
      <BlokSidePanels />
      <div>
        <div className={styles.BlokName}>Experience</div>
        <div className={styles.Content}>
          <div className={styles.Row}>
            <div className={styles.RowItem}>
              <span className={styles.RowPeriod}>2025 — Present</span>
            </div>
            <div className={styles.RowItem}>
              <span className={styles.RowName}>Dries Bos Studio</span>
              <span className={styles.RowRole}>Freelance</span>
            </div>
          </div>

          <div className={styles.Row}>
            <div className={styles.RowItem}>
              <span className={styles.RowPeriod}>2022 — 2025</span>
            </div>
            <div className={styles.RowItem}>
              <span className={styles.RowName}>Mmerch</span>
              <span className={styles.RowRole}>Senior Frontend Developer</span>
            </div>
          </div>

          <div className={styles.Row}>
            <div className={styles.RowItem}>
              <span className={styles.RowPeriod}>2020 — 2022</span>
            </div>
            <div className={styles.RowItem}>
              <span className={styles.RowName}>Anatha</span>
              <span className={styles.RowRole}>Lead UX Design</span>
            </div>
          </div>

          <div className={styles.Row}>
            <div className={styles.RowItem}>
              <span className={styles.RowPeriod}>2017 — 2019</span>
            </div>
            <div className={styles.RowItem}>
              <span className={styles.RowName}>Fotomat</span>
              <span className={styles.RowRole}>Frontend Developer</span>
            </div>
          </div>

          <div className={styles.Row}>
            <div className={styles.RowItem}>
              <span className={styles.RowPeriod}>2011 — 2015</span>
            </div>
            <div className={styles.RowItem}>
              <span className={styles.RowName}>Close My Eyes</span>
              <span className={styles.RowRole}>
                Frontend Developer + Founder
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlokExperience;
