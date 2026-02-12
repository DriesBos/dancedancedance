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
import { ProjectsProvider } from '@/providers/projects-provider';
import { fetchProjectSlugs } from '@/lib/fetch-projects';
import AppInitializer from '@/components/AppInitStore';
import ThemeBackground from '@/components/ThemeBackground';
import BlokHeadWrapper from '@/components/BlokHeadWrapper';
import BlokFilter from '@/components/BlokFilter';
import BlokFooterWrapper from '@/components/BlokFooterWrapper';
import ThemeFilter from '@/components/ThemeFilter';
import TitleSwitcher from '@/components/TitleSwitcher';
import FaviconSwitcher from '@/components/FaviconSwitcher';
import CursorLoader from '@/components/CursorLoader';

const myFont = localFont({
  src: '../assets/fonts/soehne-web-buch.woff2',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: 'Dries Bos — Creative Developer',
  description: 'Dries Bos — Creative Developer',
  appleWebApp: {
    title: 'Dries Bos',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: 'Dries Bos — Creative Developer',
    description: 'Dries Bos — Creative Developer',
    images: [
      {
        url: '/og-image.png',
        alt: 'Dries Bos — Creative Developer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dries Bos — Creative Developer',
    description: 'Dries Bos — Creative Developer',
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
  // Fetch projects at build/request time
  const projects = await fetchProjectSlugs();

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
        <ProjectsProvider projects={projects}>
          <CursorLoader />
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
              <BlokHeadWrapper />
              {/* <BlokFilter /> */}
              {children}
              <BlokFooterWrapper />
            </main>
          </StoryblokProvider>
        </ProjectsProvider>
      </AppInitializer>
    </html>
  );
}
