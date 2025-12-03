'use client';

import IconArrowLongUp from '@/components/Icons/IconArrowLongUp';
import Row from './Row';
import Link from 'next/link';
import IconLinkOutside from './Icons/IconLinkOutside';
import IconExternal from './Icons/IconExternal';
import Newsletter from './Newsletter/Newsletter';
import IconArrowHead from './Icons/IconArrowHead';

const BlokFooter = () => {
  const ScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };
  return (
    <div className="blok blok-Footer blok-Animate">
      <Row>
        <div className="column column-Year column-Copyright">
          {new Date().getFullYear()}
          <span>&copy;</span>
        </div>
        <div className="column column-FooterColumn column-Sitemap">
          <Link href="/" className="cursorInteract linkAnimation">
            Work
          </Link>
          <Link href="/about" className="cursorInteract linkAnimation">
            About
          </Link>
          {/* <Link href="/thoughts" className="cursorInteract linkAnimation">
            Thoughts
          </Link> */}
        </div>
        <div className="column column-FooterColumn">
          <a
            href="mailto:info@driesbos.com"
            target="_blank"
            className="cursorInteract linkAnimation"
          >
            <div className="hasExternalIcon">
              <span className="mailMobile">Email</span>
              <span className="mailDesktop">info@driesbos.com</span>
              <IconExternal />
            </div>
          </a>
          <a
            href="https://www.instagram.com/dries_bos"
            target="blank"
            className="cursorInteract linkAnimation hasExternalIcon"
          >
            Instagram
            <IconExternal />
          </a>
          <div className="column-Subscribe">
            <Newsletter className="cursorInteract" />
          </div>
        </div>
        <div className="column column-Icons">
          <div className="icon icon-ExternalLink">
            <IconLinkOutside />
          </div>
          <div
            onClick={ScrollToTop}
            className="icon icon-High icon-Footer cursorMagnetic"
          >
            <div className="iconLine" />
            <IconArrowHead />
          </div>
        </div>
      </Row>
    </div>
  );
};

export default BlokFooter;
