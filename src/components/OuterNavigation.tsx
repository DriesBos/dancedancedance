'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/store';
import { t } from '@/lib/locale';
import styles from './OuterNavigation.module.sass';

const OuterNavigation = () => {
  const locale = useStore((state) => state.locale);
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
          {t('nav.work', locale)}
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
          {t('nav.about', locale)}
        </span>
      </Link>
    </nav>
  );
};

export default OuterNavigation;
