import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { GoogleAnalytics } from '@next/third-parties/google';
import '@/assets/styles/reset.css';
import '@/assets/styles/form-reset.css';
import '@/assets/styles/vars.sass';
import '@/assets/styles/typography.sass';
import '@/assets/styles/transitions.sass';
import '@/assets/styles/global.sass';
import '@/assets/styles/icon-styles.sass';
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
import BackgroundEffectsByTheme from '@/components/BackgroundEffects/BackgroundEffectsByTheme';
import DotsOverlayEffectsByTheme from '@/components/BackgroundEffects/DotsOverlayEffectsByTheme';

const INITIAL_UI_STATE_SCRIPT = `
  (function () {
    var daytimeThemes = ['TRON', 'RADIANT', 'RADIANT DARK', 'AUGURIES', 'KERMIT', 'LIGHT', 'DARK', 'KUSAMA', 'DOTS'];
    var hour = new Date().getHours();
    var theme =
      hour >= 0 && hour < 5
        ? 'NIGHT MODE'
        : daytimeThemes[Math.floor(Math.random() * daytimeThemes.length)];
    var space = '3D';

    window.__DDD_INITIAL_STATE__ = { theme: theme, space: space };

    if (document.body) {
      document.body.setAttribute('data-theme', theme);
      document.body.setAttribute('data-space', space);
    }
  })();
`;

const myFont = localFont({
  src: '../assets/fonts/soehne-web-buch.woff2',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://www.driesbos.com',
  ),
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
        {/* Viewport fit for notch displays */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
      </head>
      <body
        className={`body ${myFont.className}`}
        data-border="minimal"
        data-page="home"
        data-initializing="true"
        suppressHydrationWarning
      >
        <script dangerouslySetInnerHTML={{ __html: INITIAL_UI_STATE_SCRIPT }} />
        <BackgroundEffectsByTheme />
        <AppInitializer />
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
        <DotsOverlayEffectsByTheme />
      </body>
    </html>
  );
}
