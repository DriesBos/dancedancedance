import styles from './SliderIndicators.module.sass';

interface SliderIndicatorsProps {
  total: number;
  activeIndex: number;
  className?: string;
}

const SliderIndicators = ({
  total,
  activeIndex,
  className = '',
}: SliderIndicatorsProps) => {
  if (total <= 1) return null;

  return (
    <div className={`${styles.sliderIndicator} ${className}`.trim()}>
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={styles.sliderIndicator_Item}
          data-active={index === activeIndex}
        />
      ))}
    </div>
  );
};

export default SliderIndicators;
