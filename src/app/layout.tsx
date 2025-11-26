import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { GoogleAnalytics } from '@next/third-parties/google';
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
import TitleSwitcher from '@/components/TitleSwitcher';
import FaviconSwitcher from '@/components/FaviconSwitcher';
import CustomCursor from '@/components/CustomCursor';

const myFont = localFont({
  src: '../assets/fonts/soehne-web-buch.woff2',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: 'Dries Bos — Design & Code Partner',
  description: 'Dries Bos — Design & Code Partner',
  appleWebApp: {
    title: 'Dries Bos',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: 'Dries Bos — Design & Code Partner',
    description: 'Dries Bos — Design & Code Partner',
    images: [
      {
        url: '/og-image.png',
        alt: 'Dries Bos — Design & Code Partner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dries Bos — Design & Code Partner',
    description: 'Dries Bos — Design & Code Partner',
    images: ['/og-image.png'],
  },
  other: {
    'theme-color': '#FFFFFF',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* prevent AI indexing - together with robots txt */}
        <meta name="robots" content="noai, noimageai" />
        {/* Viewport fit for notch displays */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
      </head>
      <AppInitializer className={`body ${myFont.className}`}>
        <CustomCursor />
        <TitleSwitcher />
        <FaviconSwitcher />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
        <StoryblokProvider>
          <ThemeFilter />
          {/* <ThemeBackground /> */}
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
            {/* <BlokFilter /> */}
            {children}
            <BlokFooter />
          </main>
        </StoryblokProvider>
      </AppInitializer>
    </html>
  );
}
