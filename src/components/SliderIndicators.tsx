import React from 'react';

interface SliderIndicatorsProps {
  total: number;
  activeIndex: number;
  className?: string;
}

const SliderIndicators: React.FC<SliderIndicatorsProps> = ({
  total,
  activeIndex,
  className = '',
}) => {
  if (total <= 1) return null;

  return (
    <div className={`slider-Indicators ${className}`.trim()}>
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className="slider-Indicator"
          data-active={index === activeIndex}
        />
      ))}
    </div>
  );
};

export default SliderIndicators;
