'use client';

import IconArrowLongUp from '@/components/Icons/IconArrowLongUp';
import Row from './Row';
import BlokTopPanel from './Icons/BlokTopPanel';

const BlokFooter = () => {
  const ScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };
  return (
    <div className="blok blok-Footer">
      <BlokTopPanel />
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
