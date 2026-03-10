import Link from 'next/link';
import Row from '@/components/Row';
import IconExternal from '@/components/Icons/IconExternal';
import Newsletter from '@/components/Newsletter/Newsletter';
import IconArrowHead from '@/components/Icons/IconArrowHead';
import ScrollToTopLink from './ScrollToTopLink';
import GrainyGradient from '@/components/GrainyGradient';
import BlokSidePanels from '@/components/BlokSidePanels';
import styles from './BlokFooter.module.sass';

const BlokFooter = () => {
  return (
    <div className={`blok blok-Footer blok-Animate ${styles.blokFooter}`}>
      <GrainyGradient variant="blok" />
      <BlokSidePanels />
      <Row>
        <div className={styles.footerColumnLeft}>
          <div className={`column column-FooterColumn ${styles.leftside}`}>
            <Link href="/" className="cursorInteract linkAnimation">
              Work
            </Link>
            <Link href="/about" className="cursorInteract linkAnimation">
              About
            </Link>
        </div>
        </div>
        <div className={styles.footerColumnRight}>
        <div className={`column column-FooterColumn ${styles.footerColumn} ${styles.rightside}`}>
          <a
            href="mailto:info@driesbos.com?subject=Let's Make Internet"
            target="_blank"
            className="linkAnimation cursorMessage"
            data-cursor-message="Let's talk"
          >
            <div className="hasExternalIcon">
              <span className="mailMobile">Email</span>
              <span className="mailDesktop">Info@driesbos.com</span>
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
            <div className="iconLine" />
            <IconArrowHead />
          </ScrollToTopLink>
        </div>
        </div>
      </Row>
    </div>
  );
};

export default BlokFooter;
