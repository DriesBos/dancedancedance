import type { Metadata } from 'next';
import '@/assets/styles/reset.css';
import '@/assets/styles/form-reset.css';
import '@/assets/styles/typography.sass';
import '@/assets/styles/transitions.sass';
import '@/assets/styles/global.sass';
import localFont from 'next/font/local';
import { storyblokInit, apiPlugin } from '@storyblok/react/rsc';
import StoryblokProvider from '@/components/StoryblokProvider';
import Header from '@/components/Header/Header';

const myFont = localFont({ src: '../assets/fonts/soehne-web-buch.woff2' });

export const metadata: Metadata = {
  title: 'Dance Dance Dance',
  description: 'Portfolio Dries Bos',
};

storyblokInit({
  accessToken: process.env.DB_STORYBLOK_PREVIEW,
  use: [apiPlugin],
  apiOptions: {
    region: 'eu',
  },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <StoryblokProvider>
      <html lang="en" suppressHydrationWarning={true}>
        <body className={`body ${myFont.className}`}>
          <Header />
          {children}
        </body>
      </html>
    </StoryblokProvider>
  );
}
