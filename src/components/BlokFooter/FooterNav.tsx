import Link from 'next/link';

const FooterNav = () => {
  return (
    <>
      <Link href="/" className="cursorInteract linkAnimation">
        Work
      </Link>
      <Link href="/about" className="cursorInteract linkAnimation">
        About
      </Link>
    </>
  );
};

export default FooterNav;
