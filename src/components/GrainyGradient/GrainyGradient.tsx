import styles from './GrainyGradient.module.sass';

type GrainyGradientProps = {
  variant: 'page' | 'blok';
  className?: string;
};

export default function GrainyGradient({
  variant,
  className = '',
}: GrainyGradientProps) {
  const isPage = variant === 'page';

  return (
    <div
      aria-hidden="true"
      className={`grainyGradient ${styles.layer} ${isPage ? styles.page : styles.blok} ${className}`.trim()}
    />
  );
}
