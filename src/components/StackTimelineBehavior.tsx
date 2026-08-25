'use client';

import { useEffect, useRef } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePathname } from 'next/navigation';
import { gsap } from '@/lib/gsap';
import { useStore } from '@/store/store';

gsap.registerPlugin(ScrollTrigger);

const STACK_LIFT = '--stack-lift';
const STACK_Z = '--stack-z';
const STACK_SCRUB_SECONDS = 0.8;

const isStackTimelinePath = (pathname: string | null) =>
  pathname === '/' ||
  pathname === '/about' ||
  pathname?.startsWith('/projects/') === true;

const getParticipants = (pathname: string | null) => {
  const page = document.querySelector<HTMLElement>(
    pathname?.startsWith('/projects/') ? '.page-Project' : '.page-General',
  );

  if (!page) return [];

  if (pathname === '/') {
    return Array.from(
      page.querySelectorAll<HTMLElement>(
        ':scope > .blok-Intro, :scope > .blok-Filter, :scope > .blok-ProjectList',
      ),
    );
  }

  return Array.from(
    page.querySelectorAll<HTMLElement>(
      ':scope > .blok[data-stack-item="true"]',
    ),
  );
};

const clearParticipant = (participant: HTMLElement) => {
  participant.removeAttribute('data-stack-timeline');
  participant.style.removeProperty(STACK_LIFT);
  participant.style.removeProperty(STACK_Z);
};

const clearAssignments = (main: HTMLElement) => {
  main
    .querySelectorAll<HTMLElement>('[data-stack-timeline="true"]')
    .forEach(clearParticipant);
};

const clearTimeline = (main: HTMLElement | null) => {
  if (!main) return;

  main.removeAttribute('data-stack-timeline-ready');
  clearAssignments(main);
};

const setupTimeline = (
  pathname: string | null,
  initialProgress?: number,
) => {
  const main = document.querySelector<HTMLElement>('main.main');
  if (!main || !isStackTimelinePath(pathname)) return null;

  clearAssignments(main);

  const participants = getParticipants(pathname);
  if (participants.length === 0) {
    main.removeAttribute('data-stack-timeline-ready');
    return null;
  }

  // The ready state removes the legacy footer margin. Measure the actual
  // experiment geometry so recalculation cannot alternate between two heights.
  main.dataset.stackTimelineReady = 'true';
  const maxScroll = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  );
  if (maxScroll === 0) {
    main.removeAttribute('data-stack-timeline-ready');
    return null;
  }

  const startPx = Math.min(window.innerHeight * 0.2, maxScroll * 0.08);
  const availableRange = maxScroll - startPx;
  const weights = participants.map((participant) =>
    Math.max(1, participant.getBoundingClientRect().height),
  );
  const weightTotal = weights.reduce((total, weight) => total + weight, 0);
  const lift =
    document.querySelector<HTMLElement>('.blok-Head')?.getBoundingClientRect()
      .height ?? 0;
  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: document.documentElement,
      start: 0,
      end: 'max',
      scrub: STACK_SCRUB_SECONDS,
    },
  });
  const duration = { progress: 0 };
  let rangeStart = startPx;

  timeline.to(duration, { progress: 1, duration: maxScroll }, 0);

  participants.forEach((participant, index) => {
    const rangeEnd =
      index === participants.length - 1
        ? maxScroll
        : rangeStart + (availableRange * (weights[index] ?? 1)) / weightTotal;

    participant.dataset.stackTimeline = 'true';
    participant.style.setProperty(STACK_Z, String(participants.length - index));
    timeline.to(
      participant,
      { [STACK_LIFT]: `${-lift}px`, duration: rangeEnd - rangeStart },
      rangeStart,
    );

    rangeStart = rangeEnd;
  });

  if (initialProgress !== undefined) {
    timeline.progress(initialProgress, true);
  }

  return timeline;
};

/**
 * Runs one weighted stack timeline across every participating blok.
 */
const StackTimelineBehavior = () => {
  const pathname = usePathname();
  const fullscreen = useStore((state) => state.fullscreen);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const main = document.querySelector<HTMLElement>('main.main');
    if (!main || fullscreen || !isStackTimelinePath(pathname)) {
      clearTimeline(main);
      return;
    }

    let cancelled = false;
    let timeline: ReturnType<typeof gsap.timeline> | null = null;

    const killTimeline = () => {
      timeline?.scrollTrigger?.kill();
      timeline?.kill();
      timeline = null;
    };

    const refresh = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        if (cancelled) return;
        const progress = timeline?.progress();
        killTimeline();
        timeline = setupTimeline(pathname, progress);
      });
    };

    const page = document.querySelector<HTMLElement>(
      '.page-General, .page-Project',
    );
    const resizeObserver = new ResizeObserver(refresh);
    if (page) resizeObserver.observe(page);

    window.addEventListener('resize', refresh);
    document.fonts?.ready.then(refresh);
    refresh();

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
      window.removeEventListener('resize', refresh);
      killTimeline();
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [fullscreen, pathname]);

  return null;
};

export default StackTimelineBehavior;
