'use client';

import Image from 'next/image';
import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getProjectThumbnailSrc } from '../BlokProject';
import type { ProjectData } from './projectsData';
import styles from './ThumbnailWrapper.module.sass';

export type ThumbnailWrapperEvent = {
  projectSlug: string;
  id: number;
};

interface ThumbnailWrapperProps {
  projects: ProjectData[];
  hoverEvent: ThumbnailWrapperEvent | null;
  leaveEvent: ThumbnailWrapperEvent | null;
  children?: ReactNode;
}

const HOVER_THUMBNAIL_LIFETIME_MS = 1250;

type HoverThumbnail = {
  id: number;
  projectSlug: string;
  src: string;
  alt: string;
  x: number;
  y: number;
  isLeaving: boolean;
  leaveEventId?: number;
};

type ThumbnailStyle = CSSProperties & {
  '--thumbnail-x': string;
  '--thumbnail-y': string;
};

const toPixels = (cssLength: string, remInPixels: number) => {
  const value = cssLength.trim();
  if (value.endsWith('rem')) return parseFloat(value) * remInPixels || 0;
  if (value.endsWith('px')) return parseFloat(value) || 0;
  return parseFloat(value) || 0;
};

const randomBetween = (min: number, max: number) =>
  min + Math.random() * (max - min);

const getThumbnailSize = (
  viewportWidth: number,
  viewportHeight: number,
  padding: number,
  remInPixels: number,
) => {
  const viewportFit = Math.max(
    0,
    Math.min(viewportWidth, viewportHeight) - padding * 2,
  );
  const preferredSize = Math.max(
    18 * remInPixels,
    viewportWidth * 0.25 - padding,
  );

  return Math.min(viewportFit, 36 * remInPixels, preferredSize);
};

const getRandomThumbnailPosition = () => {
  const rootStyle = getComputedStyle(document.documentElement);
  const remInPixels = parseFloat(rootStyle.fontSize) || 16;
  const rawPadding = toPixels(
    rootStyle.getPropertyValue('--spacing-base'),
    remInPixels,
  );
  const padding = Math.min(
    rawPadding,
    window.innerWidth / 2,
    window.innerHeight / 2,
  );
  const thumbnailSize = getThumbnailSize(
    window.innerWidth,
    window.innerHeight,
    padding,
    remInPixels,
  );
  const maxX = Math.max(padding, window.innerWidth - thumbnailSize - padding);
  const maxY = Math.max(padding, window.innerHeight - thumbnailSize - padding);

  return {
    x: randomBetween(padding, maxX),
    y: randomBetween(padding, maxY),
  };
};

export default function ThumbnailWrapper({
  projects,
  hoverEvent,
  leaveEvent,
  children,
}: ThumbnailWrapperProps) {
  const [hoverThumbnails, setHoverThumbnails] = useState<HoverThumbnail[]>([]);
  const thumbnailIdRef = useRef(0);
  const removeTimersRef = useRef<number[]>([]);
  const handledHoverEventIdRef = useRef<number | null>(null);
  const handledLeaveEventIdRef = useRef<number | null>(null);

  const thumbnailBySlug = useMemo(() => {
    const thumbnails = new Map<string, { src: string; alt: string }>();

    projects.forEach((project) => {
      const src = getProjectThumbnailSrc(project.thumbnail);
      if (!src) return;
      thumbnails.set(project.slug, {
        src,
        alt: project.thumbnail?.alt || project.title || '',
      });
    });

    return thumbnails;
  }, [projects]);

  useEffect(() => {
    return () => {
      removeTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (!hoverEvent || handledHoverEventIdRef.current === hoverEvent.id) return;
    handledHoverEventIdRef.current = hoverEvent.id;

    const thumbnail = thumbnailBySlug.get(hoverEvent.projectSlug);
    if (!thumbnail) return;

    const id = thumbnailIdRef.current + 1;
    thumbnailIdRef.current = id;
    const { x, y } = getRandomThumbnailPosition();

    setHoverThumbnails((items) => [
      ...items,
      {
        id,
        projectSlug: hoverEvent.projectSlug,
        src: thumbnail.src,
        alt: thumbnail.alt,
        x,
        y,
        isLeaving: false,
      },
    ]);
  }, [hoverEvent, thumbnailBySlug]);

  useEffect(() => {
    if (!leaveEvent || handledLeaveEventIdRef.current === leaveEvent.id) return;
    handledLeaveEventIdRef.current = leaveEvent.id;

    setHoverThumbnails((items) =>
      items.map((item) =>
        item.projectSlug === leaveEvent.projectSlug && !item.leaveEventId
          ? { ...item, isLeaving: true, leaveEventId: leaveEvent.id }
          : item,
      ),
    );

    const timer = window.setTimeout(() => {
      setHoverThumbnails((items) =>
        items.filter((item) => item.leaveEventId !== leaveEvent.id),
      );
      removeTimersRef.current = removeTimersRef.current.filter(
        (timerId) => timerId !== timer,
      );
    }, HOVER_THUMBNAIL_LIFETIME_MS);

    removeTimersRef.current.push(timer);
  }, [leaveEvent]);

  return (
    <div className={styles.thumbnailWrapper} aria-hidden="true">
      {hoverThumbnails.map((thumbnail) => {
        const thumbnailStyle: ThumbnailStyle = {
          '--thumbnail-x': `${thumbnail.x}px`,
          '--thumbnail-y': `${thumbnail.y}px`,
        };

        return (
          <div
            key={thumbnail.id}
            className={`${styles.thumbnailItem} ${
              thumbnail.isLeaving ? styles.thumbnailItemLeaving : ''
            }`}
            style={thumbnailStyle}
          >
            <div className={styles.thumbnailImage}>
              <Image
                className="imageItem"
                src={thumbnail.src}
                alt={thumbnail.alt}
                fill
                sizes="(max-width: 770px) calc(100vw - var(--spacing-base) * 2), 25vw"
                loading="eager"
                quality={70}
                unoptimized
              />
            </div>
          </div>
        );
      })}
      {children}
    </div>
  );
}
