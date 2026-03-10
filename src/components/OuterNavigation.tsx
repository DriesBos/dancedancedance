'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './OuterNavigation.module.sass';

const OuterNavigation = () => {
  const pathname = usePathname() || '/';
  const isAboutPage = pathname === '/about' || pathname.startsWith('/about/');

  return (
    <nav className={styles.outerNavigation} aria-label="Main navigation">
      <Link
        href="/"
        className={`${styles.outerNavigationLink} ${
          !isAboutPage ? styles.isActive : ''
        } cursorInteract linkAnimation`}
      >
        Work
      </Link>
      <Link
        href="/about"
        className={`${styles.outerNavigationLink} ${
          isAboutPage ? styles.isActive : ''
        } cursorInteract linkAnimation`}
      >
        About
      </Link>
    </nav>
  );
};

export default OuterNavigation;
