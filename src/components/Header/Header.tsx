'use client'; // Because fetching active path

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './Header.sass';

export default function Header() {
  const path = usePathname();

  return (
    <div className="header">
      <ul>
        <li>
          <Link href="/" className={path === '/' ? 'active' : ''}>
            Home
          </Link>
        </li>
        <li>
          <Link
            href="/about"
            className={path.startsWith('/about') ? 'active' : ''}
          >
            About
          </Link>
        </li>
      </ul>
    </div>
  );
}
