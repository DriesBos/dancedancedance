'use client';

import IconArrowLongUp from '@/components/Icons/IconArrowLongUp';
import Row from './Row';

const BlokFooter = () => {
  const ScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };
  return (
    <div className="blok blok-Footer">
      <Row>
        <div className="column column-Icons">
          <div onClick={ScrollToTop} className="icon icon-High icon-Footer">
            <IconArrowLongUp />
          </div>
        </div>
      </Row>
    </div>
  );
};

export default BlokFooter;
