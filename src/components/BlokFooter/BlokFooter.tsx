'use client';

import Row from '@/components/Row';
import IconExternal from '@/components/Icons/IconExternal';
import Newsletter from '@/components/Newsletter/Newsletter';
import IconArrowLongUp from '@/components/Icons/IconArrowLongUp';
import ScrollToTopLink from './ScrollToTopLink';
import GrainyGradient from '@/components/GrainyGradient';
import BlokSidePanels from '@/components/BlokSidePanels';
import FooterNav from './FooterNav';
import { useStore } from '@/store/store';
import { t } from '@/lib/locale';
import styles from './BlokFooter.module.sass';

const BlokFooter = () => {
  const locale = useStore((state) => state.locale);

  return (
    <div className={`blok blok-Footer blok-Animate ${styles.blokFooter}`}>
      <GrainyGradient variant="blok" />
      <BlokSidePanels />
      <Row>
        <div className={styles.footerColumnLeft}>
          <div className={`column column-FooterColumn ${styles.leftside}`}>
            <FooterNav />
        </div>
        </div>
        <div className={styles.footerColumnRight}>
        <div className={`column column-FooterColumn ${styles.footerColumn} ${styles.rightside}`}>
          <a
            href="mailto:hello@driesbos.com?subject=Let's Make Internet"
            target="_blank"
            className="linkAnimation cursorMessage"
            data-cursor-message={t('cursor.talk', locale)}
          >
            <div className="hasExternalIcon">
              <span className="mailMobile">Email</span>
              <span className="mailDesktop">hello@driesbos.com</span>
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
          <a
            href="https://www.linkedin.com/in/dries-bos/"
            target="blank"
            className="cursorInteract linkAnimation hasExternalIcon"
          >
            LinkedIn
            <IconExternal />
          </a>
          <div className={`column-Subscribe ${styles.newsletter}`}>
            <Newsletter className="cursorInteract" />
          </div>
        </div>
        <div className={`column column-Icons ${styles.footerIcons}`}>
          <ScrollToTopLink
            className={`icon icon-High icon-Footer cursorMagnetic ${styles.footerIcon}`}
          >
            <IconArrowLongUp />
          </ScrollToTopLink>
        </div>
        </div>
      </Row>
    </div>
  );
};

export default BlokFooter;
