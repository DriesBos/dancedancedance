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
import ActionButton, {
  ActionBlock,
  ActionButtonContainer,
} from '@/components/ActionButton';
import BlokFooterWrapper from '@/components/BlokFooterWrapper';
import ThemeFilter from '@/components/ThemeFilter';
import TitleSwitcher from '@/components/TitleSwitcher';
import FaviconSwitcher from '@/components/FaviconSwitcher';
import CursorLoader from '@/components/CursorLoader';
import BackgroundEffectsByTheme from '@/components/BackgroundEffects/BackgroundEffectsByTheme';
import DotsOverlayEffectsByTheme from '@/components/BackgroundEffects/DotsOverlayEffectsByTheme';
import GrainyGradient from '@/components/GrainyGradient';
import OuterTheming from '@/components/OuterTheming';
import OuterNavigation from '@/components/OuterNavigation';

const INITIAL_UI_STATE_SCRIPT = `
  (function () {
    var hour = new Date().getHours();
    var theme = hour >= 0 && hour < 5 ? 'NIGHT' : 'RADIANT';
    var layout = '3D';
    var skyThemeMetaColor = 'transparent';
    var themeMetaColors = {
      NIGHT: '#000000',
      TRON: '#000000',
      RADIANT: '#DAD9E0',
      SKY: 'transparent',
      KERMIT: '#FFFFFF',
      LIGHT: '#E8E7E3',
      SEGMENTS: '#1A1A1A',
      KUSAMA: '#000000',
      SPACE: '#000000',
    };
    var themeColor =
      theme === 'SKY'
        ? skyThemeMetaColor
        : (themeMetaColors[theme] || '#FFFFFF');

    window.__DDD_INITIAL_STATE__ = { theme: theme, layout: layout };

    if (document.body) {
      document.body.setAttribute('data-theme', theme);
      document.body.setAttribute('data-layout', layout);
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
  viewportFit: 'cover',
  interactiveWidget: 'overlays-content',
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
      <body
        className={`body ${myFont.className}`}
        data-border="minimal"
        data-page="home"
        data-initializing="true"
        suppressHydrationWarning
      >
        <script dangerouslySetInnerHTML={{ __html: INITIAL_UI_STATE_SCRIPT }} />
        <BackgroundEffectsByTheme />
        <GrainyGradient variant="page" />
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
            <OuterNavigation />
            <OuterTheming />
            <main className="main">
              <BlokHeadWrapper />
              {children}
              <BlokAction />
              <BlokFooterWrapper />
            </main>
            <ActionButtonContainer>
              {/* <ActionBlock variant="square" />*/}
              {/* <ActionBlock variant="round" /> */}
              <ActionButton
                copy="Start your project"
                link="info@driesbos.com?subject=Let's Make Internet"
                linkType="email"
                className="cursorInteract"
                dropLeftPx={40}
                dropOnPage="projects"
              />
              <ActionButton
                copy="Mail"
                link="info@driesbos.com?subject=Let's Make Internet"
                linkType="email"
                className="cursorInteract"
                dropLeftPx={90}
                dropOnPage="about"
              />
              <ActionButton
                copy="Schedule a discovery call"
                link="https://calendly.com/info-b9c/30min"
                linkType="url"
                className="cursorInteract"
                dropLeftPx={130}
                dropOnPage="about"
              />
            </ActionButtonContainer>
          </StoryblokProvider>
        </ProjectsProvider>
        <DotsOverlayEffectsByTheme />
      </body>
    </html>
  );
}
