'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/store';

const STACK_RANGE_START = '--stack-range-start';
const STACK_RANGE_END = '--stack-range-end';
const STACK_Z = '--stack-z';

const isStackTimelinePath = (pathname: string | null) =>
  pathname === '/' || pathname === '/about' || pathname?.startsWith('/projects/') === true;

const toPercent = (value: number) => `${value.toFixed(4)}%`;

const getParticipants = (pathname: string | null) => {
  const page = document.querySelector<HTMLElement>(
    pathname?.startsWith('/projects/') ? '.page-Project' : '.page-General',
  );

  if (!page) return [];

  if (pathname === '/') {
    const introAndFilter = Array.from(
      page.querySelectorAll<HTMLElement>(':scope > .blok-Intro, :scope > .blok-Filter'),
    );
    const projectRows = Array.from(
      page.querySelectorAll<HTMLElement>(
        ':scope > .blok-ProjectList > .blok-Project[data-stack-item="true"]',
      ),
    ).filter((item) => item.offsetParent !== null);

    return [...introAndFilter, ...projectRows];
  }

  return Array.from(page.querySelectorAll<HTMLElement>(':scope > .blok[data-stack-item="true"]'));
};

const clearParticipant = (participant: HTMLElement) => {
  participant.removeAttribute('data-stack-timeline');
  participant.style.removeProperty(STACK_RANGE_START);
  participant.style.removeProperty(STACK_RANGE_END);
  participant.style.removeProperty(STACK_Z);
};

const clearAssignments = (main: HTMLElement) => {
  main.querySelectorAll<HTMLElement>('[data-stack-timeline="true"]').forEach(clearParticipant);
};

const clearTimeline = (main: HTMLElement | null) => {
  if (!main) return;

  main.removeAttribute('data-stack-timeline-ready');
  clearAssignments(main);
};

const setupTimeline = (pathname: string | null) => {
  const main = document.querySelector<HTMLElement>('main.main');
  if (!main || !isStackTimelinePath(pathname)) return false;

  clearAssignments(main);

  const participants = getParticipants(pathname);
  if (participants.length === 0) {
    main.removeAttribute('data-stack-timeline-ready');
    return false;
  }

  // The ready state removes the legacy footer margin. Measure the actual
  // experiment geometry so recalculation cannot alternate between two heights.
  main.dataset.stackTimelineReady = 'true';
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  if (maxScroll === 0) {
    main.removeAttribute('data-stack-timeline-ready');
    return false;
  }

  const startPx = Math.min(window.innerHeight * 0.2, maxScroll * 0.08);
  const start = (startPx / maxScroll) * 100;
  const availableRange = 100 - start;
  const weights = participants.map((participant) => Math.max(1, participant.getBoundingClientRect().height));
  const weightTotal = weights.reduce((total, weight) => total + weight, 0);
  let rangeStart = start;

  participants.forEach((participant, index) => {
    const rangeEnd = index === participants.length - 1
      ? 100
      : rangeStart + (availableRange * (weights[index] ?? 1)) / weightTotal;

    participant.dataset.stackTimeline = 'true';
    participant.style.setProperty(STACK_RANGE_START, toPercent(rangeStart));
    participant.style.setProperty(STACK_RANGE_END, toPercent(rangeEnd));
    participant.style.setProperty(STACK_Z, String(participants.length - index));

    rangeStart = rangeEnd;
  });

  return true;
};

/**
 * Assigns static CSS animation ranges. Scrolling itself remains entirely CSS-owned.
 */
const StackTimelineBehavior = () => {
  const pathname = usePathname();
  const fullscreen = useStore((state) => state.fullscreen);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const main = document.querySelector<HTMLElement>('main.main');
    const supportsRootScrollTimeline = CSS.supports('animation-timeline: scroll(root block)');
    if (!main || fullscreen || !isStackTimelinePath(pathname) || !supportsRootScrollTimeline) {
      clearTimeline(main);
      return;
    }

    let cancelled = false;

    const refresh = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        if (cancelled) return;
        setupTimeline(pathname);
      });
    };

    const observer = new MutationObserver(refresh);
    observer.observe(main, { childList: true, subtree: true });

    const resizeObserver = new ResizeObserver(refresh);
    const page = document.querySelector<HTMLElement>('.page-General, .page-Project');
    if (page) resizeObserver.observe(page);

    window.addEventListener('resize', refresh);
    document.fonts?.ready.then(refresh);
    refresh();

    return () => {
      cancelled = true;
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('resize', refresh);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [fullscreen, pathname]);

  return null;
};

export default StackTimelineBehavior;
