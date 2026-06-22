import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';
import { headers } from 'next/headers';
import '@/assets/styles/reset.css';
import '@/assets/styles/form-reset.css';
import '@/assets/styles/vars.sass';
import '@/assets/styles/typography.sass';
import '@/assets/styles/global.sass';
import '@/assets/styles/icon-styles.sass';
import { fetchProjectSlugs } from '@/lib/fetch-projects';
import { getSiteUrl } from '@/lib/site-url';
import AppInitializer from '@/components/AppInitStore';
import LocaleInitializer from '@/components/LocaleInitializer';
import BlokHead from '@/components/BlokHead';
import BlokAction from '@/components/BlokAction';
import BlokFooter from '@/components/BlokFooter';
import ClientEnhancements from '@/components/ClientEnhancements';
import HeaderInitAnimation from '@/components/HeaderInitAnimation';
import PageContentGate from '@/components/PageContentGate';
import PerformanceTelemetry from '@/components/PerformanceTelemetry';
import {
  DARK_THEME,
  LIGHT_THEME,
  NIGHT_THEME,
  NIGHT_THEME_HOUR_END,
} from '@/lib/theme';
import { THEME_META_COLORS } from '@/lib/theme-meta-color';
import { DEFAULT_LOCALE } from '@/lib/locale';

const INITIAL_UI_STATE_SCRIPT = `
  (function () {
    var pathname = window.location.pathname || '/';
    var routeSlug = pathname.split('/')[1] || 'home';
    var hour = new Date().getHours();
    var prefersDark =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    var preferredTheme =
      prefersDark ? ${JSON.stringify(DARK_THEME)} : ${JSON.stringify(LIGHT_THEME)};
    var theme =
      preferredTheme === ${JSON.stringify(DARK_THEME)} &&
      hour >= 0 && hour < ${NIGHT_THEME_HOUR_END}
        ? ${JSON.stringify(NIGHT_THEME)}
        : preferredTheme;
    var fullscreen = false;
    var pageContentVisible = true;
    var themeMetaColors = ${JSON.stringify(THEME_META_COLORS)};
    var themeColor = themeMetaColors[theme] || '#FFFFFF';

    window.__DDD_INITIAL_STATE__ = {
      theme: theme,
      fullscreen: fullscreen
    };

    if (document.body) {
      document.body.setAttribute('data-theme', theme);
      document.body.setAttribute('data-fullscreen', String(fullscreen));
      document.body.setAttribute('data-page', routeSlug);
      document.body.setAttribute('data-page-content-visible', pageContentVisible ? 'true' : 'false');
    }
    document.documentElement.style.overflow = '';
    document.body && (document.body.style.overflow = '');

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

const myFont = localFont({
  src: '../assets/fonts/soehne-web-buch.woff2',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
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
    type: 'website',
    url: '/',
    siteName: 'Dries Bos',
    locale: 'en_US',
    title: 'Dries Bos — Creative Developer',
    description: 'Dries Bos — Creative Developer',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        type: 'image/png',
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

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const projects = await fetchProjectSlugs();
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const locale = DEFAULT_LOCALE;
  const performanceTelemetryEnabled =
    process.env.NEXT_PUBLIC_ENABLE_PERF_TELEMETRY === 'true';
  const pageShell = (
    <PageContentGate>
      <HeaderInitAnimation />
      <main className="main">
        <BlokHead projects={projects} />
        {children}
        <BlokAction />
        <BlokFooter locale={locale} />
      </main>
    </PageContentGate>
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        id="page-top"
        className={`body ${myFont.className}`}
        data-border="minimal"
        data-page="home"
        data-page-content-visible="true"
        data-initializing="true"
        suppressHydrationWarning
      >
        <Script id="initial-ui-state" nonce={nonce} strategy="beforeInteractive">
          {INITIAL_UI_STATE_SCRIPT}
        </Script>
        {/* Page background effects are temporarily disabled. */}
        <AppInitializer />
        <LocaleInitializer />
        <ClientEnhancements />
        {gaId && (
          <>
            <Script
              id="google-analytics-bootstrap"
              nonce={nonce}
              src={`/api/google-analytics/bootstrap?measurementId=${encodeURIComponent(gaId)}`}
              strategy="lazyOnload"
            />
            <Script
              id="google-analytics-loader"
              nonce={nonce}
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="lazyOnload"
            />
          </>
        )}
        {performanceTelemetryEnabled ? (
          <PerformanceTelemetry>{pageShell}</PerformanceTelemetry>
        ) : (
          pageShell
        )}
      </body>
    </html>
  );
}
