import styles from './page.module.sass';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="page page-Home">
      <h1>HOME</h1>
      <Link href="/about">to about</Link>
    </main>
  );
}
