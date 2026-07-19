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
import BlokHead from '@/components/BlokHead';
import BlokFooter from '@/components/BlokFooter';
import ClientEnhancements from '@/components/ClientEnhancements';
import HeaderInitAnimation from '@/components/HeaderInitAnimation';
import {
  DARK_THEME,
  LIGHT_THEME,
  NIGHT_THEME,
  NIGHT_THEME_HOUR_END,
} from '@/lib/theme';
import { THEME_META_COLORS } from '@/lib/theme-meta-color';

const SITE_TITLE = 'Freelance Creative Developer & Web Designer | Dries Bos';
const SITE_DESCRIPTION =
  'Dries Bos designs and develops high-end websites, ecommerce experiences and interactive products for creative agencies, studios and startups worldwide.';
const siteUrl = getSiteUrl();
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': `${siteUrl}/#person`,
      name: 'Dries Bos',
      url: siteUrl,
      email: 'mailto:hello@driesbos.com',
      jobTitle: 'Freelance Creative Developer and Web Designer',
      description: SITE_DESCRIPTION,
      sameAs: [
        'https://www.instagram.com/dries_bos',
        'https://www.linkedin.com/in/dries-bos/',
        'https://www.behance.net/driesbos',
        'https://github.com/DriesBos',
      ],
      knowsAbout: [
        'Creative development',
        'Web design',
        'Frontend development',
        'Web animation',
        'Ecommerce development',
        'React',
        'Vue.js',
        'Shopify',
        'Sanity',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'Dries Bos',
      description: SITE_DESCRIPTION,
      author: { '@id': `${siteUrl}/#person` },
    },
  ],
};

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
    var isMobile =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(max-width: 770px)').matches
        : window.innerWidth < 770;
    var fullscreen = isMobile;
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
  src: [
    {
      path: '../assets/fonts/soehne-web-buch.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../assets/fonts/soehne-web-kraftig.woff2',
      weight: '500',
      style: 'normal',
    },
  ],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: 'Dries Bos',
  manifest: '/manifest.webmanifest',
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
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
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
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

  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        id="page-top"
        className={`body ${myFont.className}`}
        data-border="minimal"
        data-page="home"
        data-initializing="true"
        suppressHydrationWarning
      >
        <script
          id="initial-ui-state"
          suppressHydrationWarning
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: INITIAL_UI_STATE_SCRIPT }}
        />
        <script
          id="person-structured-data"
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, '\\u003c'),
          }}
        />
        {/* Page background effects are temporarily disabled. */}
        <AppInitializer />
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
        <HeaderInitAnimation />
        <main className="main">
          <BlokHead projects={projects} />
          {children}
          <BlokFooter />
        </main>
      </body>
    </html>
  );
}
