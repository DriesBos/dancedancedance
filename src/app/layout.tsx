import type { Metadata } from 'next';
import '@/assets/styles/reset.css';
import '@/assets/styles/form-reset.css';
import '@/assets/styles/typography.sass';
import '@/assets/styles/transitions.sass';
import '@/assets/styles/global.sass';
import localFont from '@next/font/local';
import Header from '@/components/Header/Header';

const myFont = localFont({ src: '../assets/fonts/soehne-web-buch.woff2' });

export const metadata: Metadata = {
  title: 'Dries Bos',
  description: 'Portfolio Dries Bos',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={myFont.className}>
        <Header />
        {children}
      </body>
    </html>
  );
}
