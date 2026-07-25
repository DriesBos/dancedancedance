import Link from 'next/link';

const FooterNav = () => {
  return (
    <>
      <Link href="/" prefetch={true} className="cursorInteract linkAnimation">
        Work
      </Link>
      <Link href="/about" prefetch={true} className="cursorInteract linkAnimation">
        About
      </Link>
    </>
  );
};

export default FooterNav;
