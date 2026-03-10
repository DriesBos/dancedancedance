'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Row from '@/components/Row';
import IconLinkOutside from '@/components/Icons/IconLinkOutside';
import IconExternal from '@/components/Icons/IconExternal';
import Newsletter from '@/components/Newsletter/Newsletter';
import IconArrowHead from '@/components/Icons/IconArrowHead';
import GrainyGradient from '@/components/GrainyGradient';
import { useStore } from '@/store/store';
import BlokSidePanels from '@/components/BlokSidePanels';
import styles from './BlokFooter.module.sass';

const BlokFooter = () => {
  const theme = useStore((state) => state.theme);
  const layout = useStore((state) => state.layout);
  const cycleTheme = useStore((state) => state.cycleTheme);
  const setTwoD = useStore((state) => state.setTwoD);
  const setThreeD = useStore((state) => state.setThreeD);

  const ScrollToTop = () => {
    try {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch {
      window.scrollTo(0, 0);
    }
  };
  return (
    <div className={`blok blok-Footer blok-Animate ${styles.blokFooter}`}>
      <GrainyGradient variant="blok" />
      <BlokSidePanels />
      <Row>
        <div className={styles.footerColumnLeft}>
          <div className={`column column-FooterColumn`}>
            <Link href="/" className="cursorInteract linkAnimation">
              work
            </Link>
            <Link href="/about" className="cursorInteract linkAnimation">
              about
            </Link>
        </div>
        </div>
        <div className={styles.footerColumnRight}>
        <div className={`column column-FooterColumn ${styles.footerColumn}`}>
          <a
            href="mailto:info@driesbos.com?subject=Let's Make Internet"
            target="_blank"
            className="linkAnimation cursorMessage"
            data-cursor-message="Let's talk"
          >
            <div className="hasExternalIcon">
              <span className="mailMobile">email</span>
              <span className="mailDesktop">info@driesbos.com</span>
              <IconExternal />
            </div>
          </a>
          <a
            href="https://www.instagram.com/dries_bos"
            target="blank"
            className="cursorInteract linkAnimation hasExternalIcon"
          >
            instagram
            <IconExternal />
          </a>
          <a
            href="https://www.linkedin.com/in/dries-bos/"
            target="blank"
            className="cursorInteract linkAnimation hasExternalIcon"
          >
            linkedin
            <IconExternal />
          </a>
          <div className={`column-Subscribe ${styles.newsletter}`}>
            <Newsletter className="cursorInteract" />
          </div>
        </div>
        <div className={`column column-Icons ${styles.footerIcons}`}>
          <div
            onClick={ScrollToTop}
            className={`icon icon-High icon-Footer cursorMagnetic ${styles.footerIcon}`}
          >
            <div className="iconLine" />
            <IconArrowHead />
          </div>
        </div>
        </div>
      </Row>
    </div>
  );
};

export default BlokFooter;
