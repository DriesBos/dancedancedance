import Link from 'next/link';
import { t, type Locale } from '@/lib/locale';

interface FooterNavProps {
  locale: Locale;
}

const FooterNav = ({ locale }: FooterNavProps) => {
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
