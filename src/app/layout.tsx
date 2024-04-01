import type { Metadata } from 'next';
import './globals.sass';

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
      <body>{children}</body>
    </html>
  );
}
