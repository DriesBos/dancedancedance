import { useId } from 'react';
import styles from './GrainyGradient.module.sass';

type GrainyGradientProps = {
  variant: 'page' | 'blok';
};

export default function GrainyGradient({ variant }: GrainyGradientProps) {
  const uid = useId().replace(/:/g, '');
  const noiseId = `grain-noise-${uid}`;
  const isPage = variant === 'page';

  return (
    <div
      aria-hidden="true"
      className={`${styles.layer} ${isPage ? styles.page : styles.blok}`}
    >
      <svg
        className={styles.svg}
        viewBox="0 0 200 200"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id={noiseId}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency={0.65}
              numOctaves={3}
              stitchTiles="stitch"
            />
          </filter>
        </defs>
        <rect
          width="100%"
          height="100%"
          filter={`url(#${noiseId})`}
          opacity={1}
        />
      </svg>
    </div>
  );
}
