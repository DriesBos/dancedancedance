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
import BlokHeadWrapper from '@/components/BlokHeadWrapper';
import BlokAction from '@/components/BlokAction';
import BlokFooterWrapper from '@/components/BlokFooterWrapper';
import ThemeFilter from '@/components/ThemeFilter';
import TitleSwitcher from '@/components/TitleSwitcher';
import FaviconSwitcher from '@/components/FaviconSwitcher';
import CursorLoader from '@/components/CursorLoader';
import BackgroundEffectsByTheme from '@/components/BackgroundEffects/BackgroundEffectsByTheme';
import DotsOverlayEffectsByTheme from '@/components/BackgroundEffects/DotsOverlayEffectsByTheme';

const INITIAL_UI_STATE_SCRIPT = `
  (function () {
    var isHome = window.location.pathname === '/';
    var daytimeThemes = ['TRON', 'RADIANT', 'RADIANT DARK', 'AUGURIES', 'KERMIT', 'LIGHT', 'DARK', 'KUSAMA', 'DOTS'];
    var hour = new Date().getHours();
    var skyVariation =
      hour >= 4 && hour < 5
        ? 'morning'
        : hour >= 5 && hour < 10
        ? 'dawn'
        : hour >= 10 && hour < 17
        ? 'noon'
        : hour >= 17 && hour < 19
        ? 'sunset'
        : hour >= 19 && hour < 21
        ? 'dusk'
        : 'evening';
    var theme =
      isHome
        ? 'RADIANT'
        : hour >= 0 && hour < 5
        ? 'NIGHT MODE'
        : daytimeThemes[Math.floor(Math.random() * daytimeThemes.length)];
    var layout = '3D';
    var auguriesMetaColors = {
      morning: '#6D79AF',
      dawn: '#F5B38B',
      noon: '#B7D5FF',
      sunset: '#FF8A5B',
      dusk: '#8E5CA5',
      evening: '#2B3D74',
    };
    var themeMetaColors = {
      'NIGHT MODE': '#000000',
      TRON: '#000000',
      RADIANT: '#DAD9E0',
      'RADIANT DARK': '#000000',
      AUGURIES: '#B7D5FF',
      KERMIT: '#FFFFFF',
      LIGHT: '#E8E7E3',
      DARK: '#1A1A1A',
      KUSAMA: '#000000',
      DOTS: '#000000',
    };
    var themeColor =
      theme === 'AUGURIES'
        ? (auguriesMetaColors[skyVariation] || themeMetaColors.AUGURIES)
        : (themeMetaColors[theme] || '#FFFFFF');

    window.__DDD_INITIAL_STATE__ = { theme: theme, layout: layout, skyVariation: skyVariation };

    if (document.body) {
      document.body.setAttribute('data-theme', theme);
      document.body.setAttribute('data-space', layout);
      document.body.setAttribute('data-sky-variation', skyVariation);
    }

    var metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColor);
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
    'theme-color': '#0D111A',
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
              <BlokAction />
              <BlokFooterWrapper />
            </main>
          </StoryblokProvider>
        </ProjectsProvider>
        <DotsOverlayEffectsByTheme />
      </body>
    </html>
  );
}
