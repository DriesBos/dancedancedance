import { NextResponse } from 'next/server';

interface TelemetryEvent {
  kind: 'web-vital' | 'react-profiler';
  [key: string]: unknown;
}

interface TelemetryPayload {
  pathname?: string;
  href?: string;
  timestamp?: number;
  events?: TelemetryEvent[];
}

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let payload: TelemetryPayload;

  try {
    payload = (await request.json()) as TelemetryPayload;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload' }, { status: 400 });
  }

  const events = Array.isArray(payload.events) ? payload.events.slice(0, 100) : [];

  if (events.length === 0) {
    return NextResponse.json({ ok: true, accepted: 0 }, { status: 202 });
  }

  if (
    process.env.PERFORMANCE_TELEMETRY_LOG === 'true' ||
    process.env.NODE_ENV !== 'production'
  ) {
    console.info('[performance-telemetry]', {
      pathname: payload.pathname,
      href: payload.href,
      timestamp: payload.timestamp,
      accepted: events.length,
      events,
    });
  }

  return NextResponse.json({ ok: true, accepted: events.length }, { status: 202 });
}
