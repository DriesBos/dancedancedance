'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './OuterNavigation.module.sass';

const OuterNavigation = () => {
  const pathname = usePathname() || '/';
  const isAboutRoute = pathname === '/about' || pathname.startsWith('/about/');
  const isRouteActive = (href: string) => {
    if (href === '/about') return isAboutRoute;
    if (href === '/') return !isAboutRoute;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className={styles.outerNavigation} aria-label="Main navigation">
      <Link
        href="/"
        className={`${styles.outerNavigationButton} cursorInteract`}
        data-actie={isRouteActive('/')}
      >
        <span
          className={`${styles.outerNavigationLink} ${
            isRouteActive('/') ? 'linkHyperAnimation' : 'linkAnimation'
          }`}
        >
          Work
        </span>
      </Link>
      <Link
        href="/about"
        className={`${styles.outerNavigationButton} cursorInteract`}
        data-actie={isRouteActive('/about')}
      >
        <span
          className={`${styles.outerNavigationLink} ${
            isRouteActive('/about') ? 'linkHyperAnimation' : 'linkAnimation'
          }`}
        >
          About
        </span>
      </Link>
    </nav>
  );
};

export default OuterNavigation;
