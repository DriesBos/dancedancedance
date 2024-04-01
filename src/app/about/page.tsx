import styles from './page.module.sass';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="page page-About">
      <h1>About Jah</h1>
      <Link href="/">to home</Link>
    </main>
  );
}
