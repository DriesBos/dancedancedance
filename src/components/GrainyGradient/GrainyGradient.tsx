import styles from './GrainyGradient.module.sass';

type GrainyGradientProps = {
  variant: 'page' | 'blok';
};

export default function GrainyGradient({ variant }: GrainyGradientProps) {
  const isPage = variant === 'page';

  return (
    <div
      aria-hidden="true"
      className={`${styles.layer} ${isPage ? styles.page : styles.blok}`}
    />
  );
}
