import type { Metadata } from 'next';
import './globals.sass';
import Header from '@/components/Header/Header';

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
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
