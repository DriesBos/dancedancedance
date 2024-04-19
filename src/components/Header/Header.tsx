import Link from 'next/link';
import './Header.sass';

export default function Header() {
  return (
    <div className="header">
      <ul>
        <li>
          <Link href="/">Home</Link>
        </li>
        <li>
          <Link href="/about">About</Link>
        </li>
      </ul>
    </div>
  );
}
