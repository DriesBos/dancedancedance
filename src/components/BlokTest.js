'use client';

import IconArrowLongUp from './Icons/IconArrowLongUp';
import { useRef, useState, useEffect } from 'react';

const BlokTest = ({ onRangeChange }) => {
  const rangeSlider = useRef(null);
  const [range, setRange] = useState(0.5);

  useEffect(() => {
    if (onRangeChange) {
      onRangeChange(range);
    }
  }, [range, onRangeChange]);

  return (
    <div className="blokTest">
      <div className="blokTest_Row">
        <div className="blokTest_Column blokTest_Column-Range">
          <div className="rangeSlider" ref={rangeSlider}>
            <input
              className="rangeSlider_Input"
              type="range"
              value={range}
              min="0.5"
              max="1"
              step="0.01"
              onChange={(e) => setRange(e.target.value)}
            />
            <span className="rangeSlider_Value">{range}</span>
          </div>
        </div>
        <div className="blokTest_Column">
          <div className="icon icon-High icon-Footer">
            <IconArrowLongUp />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlokTest;
