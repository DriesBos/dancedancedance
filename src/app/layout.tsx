import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '@/assets/styles/reset.css';
import '@/assets/styles/form-reset.css';
import '@/assets/styles/vars.sass';
import '@/assets/styles/typography.sass';
import '@/assets/styles/transitions.sass';
import '@/assets/styles/global.sass';
import StoryblokProvider from '@/providers/storyblok-provider';
import AppInitializer from '@/components/AppInitStore';
import ThemeBackground from '@/components/ThemeBackground';
import BlokHead from '@/components/BlokHead';
import BlokFilter from '@/components/BlokFilter';
import BlokFooter from '@/components/BlokFooter';
import ThemeFilter from '@/components/ThemeFilter';

const myFont = localFont({ src: '../assets/fonts/soehne-web-buch.woff2' });

export const metadata: Metadata = {
  title: 'Dries Bos',
  description:
    'Dries Bos, computational design, creative development & digital partner',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <StoryblokProvider>
        <AppInitializer className={`body ${myFont.className}`}>
          <ThemeFilter />
          <ThemeBackground />
          {/* <div className="laserBlok">
            <div className="laserBlok-Line"></div>
          </div> */}
          {/* <div className="introText">
            <h1>
              Dries Bos, computational design, creative development & digital
              partner
            </h1>
          </div> */}
          <main className="main">
            <BlokHead />
            <BlokFilter />
            {children}
            <BlokFooter />
          </main>
        </AppInitializer>
      </StoryblokProvider>
    </html>
  );
}
