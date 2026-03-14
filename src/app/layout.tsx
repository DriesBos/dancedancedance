import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';
import '@/assets/styles/reset.css';
import '@/assets/styles/form-reset.css';
import '@/assets/styles/vars.sass';
import '@/assets/styles/typography.sass';
import '@/assets/styles/transitions.sass';
import '@/assets/styles/global.sass';
import '@/assets/styles/icon-styles.sass';
import { fetchProjectSlugs } from '@/lib/fetch-projects';
import AppInitializer from '@/components/AppInitStore';
import BlokHead from '@/components/BlokHead';
import BlokAction from '@/components/BlokAction';
import ActionButton, {
  ActionButtonContainer,
} from '@/components/ActionButton';
import BlokFooter from '@/components/BlokFooter';
import BackgroundEffectsByTheme from '@/components/BackgroundEffects/BackgroundEffectsByTheme';
import GrainyGradient from '@/components/GrainyGradient';
import OuterTheming from '@/components/OuterTheming';
import OuterNavigation from '@/components/OuterNavigation';
import ClientEnhancements from '@/components/ClientEnhancements';
import PageContentGate from '@/components/PageContentGate';
import PerformanceTelemetry from '@/components/PerformanceTelemetry';
import {
  DEFAULT_THEME,
  INITIAL_THEME_MOBILE_BREAKPOINT_PX,
  NIGHT_THEME,
  THEMES_WITH_INITIAL_INTRO,
} from '@/lib/theme';
import { THEME_META_COLORS } from '@/lib/theme-meta-color';

const INITIAL_UI_STATE_SCRIPT = `
  (function () {
    var pathname = window.location.pathname || '/';
    var routeSlug = pathname.split('/')[1] || 'home';
    var suppressInitialLandingEffects =
      routeSlug === 'about' || routeSlug === 'projects';
    var hour = new Date().getHours();
    var viewportWidth =
      window.innerWidth ||
      document.documentElement.clientWidth ||
      0;
    var theme =
      hour >= 0 && hour < 5
        ? ${JSON.stringify(NIGHT_THEME)}
        : viewportWidth <= ${INITIAL_THEME_MOBILE_BREAKPOINT_PX}
          ? 'TRON'
          : ${JSON.stringify(DEFAULT_THEME)};
    var fullscreen = false;
    var initialThemeIntroPending =
      !suppressInitialLandingEffects &&
      ${JSON.stringify(THEMES_WITH_INITIAL_INTRO)}.indexOf(theme) !== -1;
    var pageContentVisible = !initialThemeIntroPending;
    var themeMetaColors = ${JSON.stringify(THEME_META_COLORS)};
    var themeColor = themeMetaColors[theme] || '#FFFFFF';

    window.__DDD_INITIAL_STATE__ = {
      theme: theme,
      fullscreen: fullscreen,
      initialThemeIntroPending: initialThemeIntroPending,
      initialRouteEffectsSuppressedPathname: suppressInitialLandingEffects
        ? pathname
        : null
    };

    if (document.body) {
      document.body.setAttribute('data-theme', theme);
      document.body.setAttribute('data-fullscreen', String(fullscreen));
      document.body.setAttribute('data-page', routeSlug);
      document.body.setAttribute('data-page-content-visible', pageContentVisible ? 'true' : 'false');
    }

    var metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColor);
    }

    var clearInitializing = function () {
      if (!document.body) return;
      document.body.removeAttribute('data-initializing');
    };

    var scheduleClearInitializing = function () {
      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(clearInitializing);
        });
      }
      window.setTimeout(clearInitializing, 450);
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', scheduleClearInitializing, {
        once: true,
      });
    } else {
      scheduleClearInitializing();
    }
  })();
`;

const buildGoogleAnalyticsBootstrapScript = (gaId: string) => `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  window.gtag = window.gtag || gtag;
  gtag('js', new Date());
  gtag('config', '${gaId}');
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
  applicationName: 'Dries Bos',
  manifest: '/manifest.webmanifest',
  title: 'Dries Bos — Creative Developer',
  description: 'Dries Bos — Creative Developer',
  icons: {
    apple: [
      {
        url: '/web-app-icon-180.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
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
  const projects = await fetchProjectSlugs();
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="en">
      <body
        id="page-top"
        className={`body ${myFont.className}`}
        data-border="minimal"
        data-page="home"
        data-page-content-visible="true"
        data-initializing="true"
        suppressHydrationWarning
      >
        <Script id="initial-ui-state" strategy="beforeInteractive">
          {INITIAL_UI_STATE_SCRIPT}
        </Script>
        <BackgroundEffectsByTheme />
        <GrainyGradient variant="page" />
        <AppInitializer />
        <ClientEnhancements />
        {gaId && (
          <>
            <Script
              id="google-analytics-loader"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="lazyOnload"
            />
            <Script id="google-analytics" strategy="lazyOnload">
              {buildGoogleAnalyticsBootstrapScript(gaId)}
            </Script>
          </>
        )}
        <PerformanceTelemetry>
          <PageContentGate>
            <OuterNavigation />
            <OuterTheming />
            <main className="main">
              <BlokHead projects={projects} />
              {children}
              <BlokAction />
              <BlokFooter />
            </main>
            <ActionButtonContainer>
              <ActionButton
                copy="Start your project"
                link="info@driesbos.com?subject=Let's Make Internet"
                linkType="email"
                className="cursorInteract"
                dropLeftPx={20}
                dropOnPage="projects"
              />
              {/* <ActionButton
                copy="Let's talk"
                link="info@driesbos.com?subject=Let's Make Internet"
                linkType="email"
                className="cursorInteract"
                dropLeftPx={20}
                dropOnPage="about"
              /> */}
              <ActionButton
                copy="Schedule a discovery call"
                link="https://calendly.com/info-b9c/30min"
                linkType="url"
                className="cursorInteract"
                dropLeftPx={50}
                dropOnPage="about"
              />
            </ActionButtonContainer>
          </PageContentGate>
        </PerformanceTelemetry>
      </body>
    </html>
  );
}
