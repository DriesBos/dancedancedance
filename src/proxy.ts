import { NextResponse } from 'next/server';

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

const CONTENT_SECURITY_POLICY =
  [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.storyblok.com https://*.storyblokchina.cn https://image.mux.com https://www.google-analytics.com https://www.googletagmanager.com",
    "font-src 'self' data:",
    "connect-src 'self' https://api.storyblok.com https://*.storyblok.com https://*.storyblokchina.cn https://*.mux.com https://*.mux-data.com https://image.mux.com https://www.google-analytics.com https://region1.google-analytics.com https://stats.g.doubleclick.net",
    "media-src 'self' blob: https://*.mux.com https://*.storyblok.com https://*.storyblokchina.cn",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ].join('; ');

export function proxy() {
  const response = NextResponse.next();

  response.headers.set('Content-Security-Policy', CONTENT_SECURITY_POLICY);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(name, value);
  }

  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico|favicon-light.ico|favicon-dark.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2|css|js|map)$).*)',
    },
  ],
};
