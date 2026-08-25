import Link from 'next/link';
import ColorBurstText from '@/components/ColorBurstTypography/ColorBurstText';

const FooterNav = () => {
  return (
    <>
      <Link href="/" prefetch={true} className="cursorInteract linkAnimation">
        <ColorBurstText>Work</ColorBurstText>
      </Link>
      <Link href="/about" prefetch={true} className="cursorInteract linkAnimation">
        <ColorBurstText>About</ColorBurstText>
      </Link>
    </>
  );
};

export default FooterNav;
