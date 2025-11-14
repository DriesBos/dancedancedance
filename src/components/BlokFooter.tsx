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
    <div className="blok blok-Footer blok-Animate">
      <Row className="row-Footer">
        <div className="column column-Copyright">
          &copy; {new Date().getFullYear()}
        </div>
        <div className="column column-Email">
          <a href="mailto:info@driesbos.com">info@driesbos.com</a>
        </div>
        {/* <div className="column column-Subscribe">Subscribe</div> */}
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
