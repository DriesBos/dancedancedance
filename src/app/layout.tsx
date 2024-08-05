import type { Metadata } from 'next';
import '@/assets/styles/reset.css';
import '@/assets/styles/form-reset.css';
import '@/assets/styles/vars.css';
import '@/assets/styles/typography.sass';
import '@/assets/styles/transitions.sass';
import '@/assets/styles/global.sass';
import localFont from 'next/font/local';
import { storyblokInit, apiPlugin } from '@storyblok/react/rsc';
import StoryblokProvider from '@/components/StoryblokProvider';
import BlokHead from '@/components/BlokHead';
import BlokFooter from '@/components/BlokFooter';
import AppInitializer from '@/components/AppInitStore';
import StoreSwitcher from '@/components/StoreSwitcher';
import BlokFilter from '@/components/BlokFilter';
import ThemeBackground from '@/components/ThemeBackground';

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <StoryblokProvider>
      <html lang="en" suppressHydrationWarning={true}>
        <AppInitializer className={`body ${myFont.className}`}>
          <ThemeBackground />
          <main className="main">
            <BlokHead />
            <BlokFilter />
            {children}
            <BlokFooter />
          </main>
        </AppInitializer>
      </html>
    </StoryblokProvider>
  );
}
