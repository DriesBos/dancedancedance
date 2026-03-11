'use client';

import { Profiler, type ProfilerOnRenderCallback, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useReportWebVitals } from 'next/web-vitals';

type TelemetryEvent =
  | {
      kind: 'web-vital';
      name: string;
      id: string;
      value: number;
      delta: number;
      rating?: 'good' | 'needs-improvement' | 'poor';
      navigationType?: string;
      pathname: string;
      timestamp: number;
    }
  | {
      kind: 'react-profiler';
      id: string;
      phase: 'mount' | 'update' | 'nested-update';
      actualDuration: number;
      baseDuration: number;
      startTime: number;
      commitTime: number;
      pathname: string;
      timestamp: number;
    };

const TELEMETRY_ENDPOINT = '/api/telemetry/performance';
const FLUSH_INTERVAL_MS = 10_000;
const MAX_BATCH_SIZE = 20;
const PROFILER_SAMPLE_RATE = 0.25;

interface PerformanceTelemetryProps {
  children: ReactNode;
}

const PerformanceTelemetry = ({ children }: PerformanceTelemetryProps) => {
  const pathname = usePathname() || '/';
  const queueRef = useRef<TelemetryEvent[]>([]);
  const isFlushingRef = useRef(false);
  const telemetryEnabled = process.env.NEXT_PUBLIC_ENABLE_PERF_TELEMETRY === 'true';

  const flush = useCallback(() => {
    if (!telemetryEnabled || isFlushingRef.current || queueRef.current.length === 0) {
      return;
    }

    const events = queueRef.current.splice(0, MAX_BATCH_SIZE);
    const payload = JSON.stringify({
      pathname,
      href: window.location.href,
      timestamp: Date.now(),
      events,
    });

    isFlushingRef.current = true;

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(TELEMETRY_ENDPOINT, blob);
      isFlushingRef.current = false;
      return;
    }

    void fetch(TELEMETRY_ENDPOINT, {
      method: 'POST',
      body: payload,
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }).finally(() => {
      isFlushingRef.current = false;
    });
  }, [pathname, telemetryEnabled]);

  const enqueue = useCallback(
    (event: TelemetryEvent) => {
      if (!telemetryEnabled) {
        return;
      }

      queueRef.current.push(event);
      if (queueRef.current.length >= MAX_BATCH_SIZE) {
        flush();
      }
    },
    [flush, telemetryEnabled],
  );

  useReportWebVitals(
    useCallback(
      (metric) => {
        enqueue({
          kind: 'web-vital',
          name: metric.name,
          id: metric.id,
          value: metric.value,
          delta: metric.delta,
          rating: metric.rating,
          navigationType:
            'navigationType' in metric && typeof metric.navigationType === 'string'
              ? metric.navigationType
              : undefined,
          pathname,
          timestamp: Date.now(),
        });
      },
      [enqueue, pathname],
    ),
  );

  useEffect(() => {
    if (!telemetryEnabled) {
      return;
    }

    const intervalId = window.setInterval(flush, FLUSH_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flush();
      }
    };

    const handlePageHide = () => {
      flush();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      flush();
    };
  }, [flush, telemetryEnabled]);

  const handleRender = useCallback<ProfilerOnRenderCallback>(
    (id, phase, actualDuration, baseDuration, startTime, commitTime) => {
      if (!telemetryEnabled) {
        return;
      }

      if (Math.random() > PROFILER_SAMPLE_RATE) {
        return;
      }

      enqueue({
        kind: 'react-profiler',
        id,
        phase,
        actualDuration,
        baseDuration,
        startTime,
        commitTime,
        pathname,
        timestamp: Date.now(),
      });
    },
    [enqueue, pathname, telemetryEnabled],
  );

  if (!telemetryEnabled) {
    return <>{children}</>;
  }

  return (
    <Profiler id="app-root" onRender={handleRender}>
      {children}
    </Profiler>
  );
};

export default PerformanceTelemetry;
