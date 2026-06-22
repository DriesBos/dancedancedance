import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MEASUREMENT_ID_PATTERN = /^(?:G|GT|AW)-[A-Z0-9-]+$/i;

export function GET(request: NextRequest) {
  const measurementId = request.nextUrl.searchParams.get('measurementId') ?? '';

  if (!GOOGLE_MEASUREMENT_ID_PATTERN.test(measurementId)) {
    return new NextResponse('', {
      status: 400,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  const script = [
    'window.dataLayer = window.dataLayer || [];',
    'function gtag(){dataLayer.push(arguments);}',
    'window.gtag = window.gtag || gtag;',
    "gtag('js', new Date());",
    `gtag('config', ${JSON.stringify(measurementId)});`,
  ].join('\n');

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
