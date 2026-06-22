import styles from './BlokExperience.module.sass';
import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import BlokSidePanels from '../../BlokSidePanels';
import GrainyGradient from '@/components/GrainyGradient';

const experienceItems = [
  {
    period: '2025—Present',
    name: 'Dries Bos Studio',
    role: 'Freelance Creative Developer',
  },
  {
    period: '2022—2025',
    name: 'Mmerch',
    role: 'Senior Frontend Developer',
  },
  {
    period: '2020—2022',
    name: 'Anatha',
    role: 'Lead UX Engineer',
  },
  {
    period: '2017—2019',
    name: 'Fotomat',
    role: 'Frontend Developer',
  },
  {
    period: '2011—2015',
    name: 'Close My Eyes',
    role: 'E-Commerce Developer, Founder',
  },
];

interface BlokProps {
  blok: SbBlokData;
}

const BlokExperience = ({ blok }: BlokProps) => {
  return (
    <div className="blok blok-Exp blok-Animate" {...storyblokEditable(blok)}>
      <GrainyGradient variant="blok" />
      <BlokSidePanels />
      <div className={styles.blokName}>
        <h2>Experience</h2>
      </div>
      <div className={styles.content}>
        {experienceItems.map(({ period, name, role }) => (
          <div className={styles.row} key={name}>
            <div className={styles.rowItem}>
              <span className={styles.rowPeriod}>{period}</span>
            </div>
            <div className={styles.rowItem}>
              <span className={styles.rowName}>{name}</span>
              <span className={styles.rowRole}>{role}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlokExperience;
