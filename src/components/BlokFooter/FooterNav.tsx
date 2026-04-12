'use client';

import Link from 'next/link';
import { useStore } from '@/store/store';
import { t } from '@/lib/locale';

const FooterNav = () => {
  const locale = useStore((state) => state.locale);

  return (
    <>
      <Link href="/" className="cursorInteract linkAnimation">
        {t('nav.work', locale)}
      </Link>
      <Link href="/about" className="cursorInteract linkAnimation">
        {t('nav.about', locale)}
      </Link>
    </>
  );
};

export default FooterNav;
