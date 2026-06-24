'use client';

import Image from 'next/image';
import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getProjectThumbnailSrc } from '../BlokProject';
import type { ProjectData } from './projectsData';
import styles from './GridThumbnailWrapper.module.sass';

export type ThumbnailWrapperEvent = {
  projectSlug: string;
  id: number;
};

interface GridThumbnailWrapperProps {
  projects: ProjectData[];
  hoverEvent: ThumbnailWrapperEvent | null;
  leaveEvent: ThumbnailWrapperEvent | null;
  children?: ReactNode;
}

const LANDSCAPE_GRID_COLUMN_COUNT = 4;
const LANDSCAPE_GRID_ROW_COUNT = 2;
const PORTRAIT_GRID_COLUMN_COUNT = 2;
const GRID_SLOT_COUNT = LANDSCAPE_GRID_COLUMN_COUNT * LANDSCAPE_GRID_ROW_COUNT;
const HOVER_THUMBNAIL_LIFETIME_MS = 1250;

type HoverThumbnail = {
  id: number;
  projectSlug: string;
  src: string;
  alt: string;
  landscapeColumn: number;
  landscapeRow: number;
  portraitColumn: number;
  portraitRow: number;
  isLeaving: boolean;
  leaveEventId?: number;
};

type ThumbnailStyle = CSSProperties & {
  '--thumbnail-landscape-column': string;
  '--thumbnail-landscape-row': string;
  '--thumbnail-landscape-overlap-x': string;
  '--thumbnail-landscape-overlap-y': string;
  '--thumbnail-portrait-column': string;
  '--thumbnail-portrait-row': string;
  '--thumbnail-portrait-overlap-x': string;
  '--thumbnail-portrait-overlap-y': string;
};

const getGridThumbnailPosition = (projectIndex: number) => {
  const slotIndex = projectIndex % GRID_SLOT_COUNT;

  return {
    landscapeColumn: (slotIndex % LANDSCAPE_GRID_COLUMN_COUNT) + 1,
    landscapeRow: Math.floor(slotIndex / LANDSCAPE_GRID_COLUMN_COUNT) + 1,
    portraitColumn: (slotIndex % PORTRAIT_GRID_COLUMN_COUNT) + 1,
    portraitRow: Math.floor(slotIndex / PORTRAIT_GRID_COLUMN_COUNT) + 1,
  };
};

export default function GridThumbnailWrapper({
  projects,
  hoverEvent,
  leaveEvent,
  children,
}: GridThumbnailWrapperProps) {
  const [hoverThumbnails, setHoverThumbnails] = useState<HoverThumbnail[]>([]);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
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

  const projectIndexBySlug = useMemo(() => {
    const indexes = new Map<string, number>();

    projects.forEach((project, index) => {
      indexes.set(project.slug, index);
    });

    return indexes;
  }, [projects]);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    return () => {
      removeTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (!hoverEvent || handledHoverEventIdRef.current === hoverEvent.id) return;
    handledHoverEventIdRef.current = hoverEvent.id;

    const thumbnail = thumbnailBySlug.get(hoverEvent.projectSlug);
    const projectIndex = projectIndexBySlug.get(hoverEvent.projectSlug);
    if (!thumbnail || projectIndex === undefined) return;

    const gridPosition = getGridThumbnailPosition(projectIndex);

    setHoverThumbnails((items) => {
      const existingItem = items.find(
        (item) => item.projectSlug === hoverEvent.projectSlug,
      );

      if (existingItem) {
        return items.map((item) =>
          item.projectSlug === hoverEvent.projectSlug
            ? {
                ...item,
                src: thumbnail.src,
                alt: thumbnail.alt,
                ...gridPosition,
                isLeaving: false,
                leaveEventId: undefined,
              }
            : item,
        );
      }

      const id = thumbnailIdRef.current + 1;
      thumbnailIdRef.current = id;

      return [
        ...items,
        {
          id,
          projectSlug: hoverEvent.projectSlug,
          src: thumbnail.src,
          alt: thumbnail.alt,
          ...gridPosition,
          isLeaving: false,
        },
      ];
    });
  }, [hoverEvent, projectIndexBySlug, thumbnailBySlug]);

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

  const hasVisibleThumbnails = hoverThumbnails.length > 0;
  const hasActiveThumbnails = hoverThumbnails.some(
    (thumbnail) => !thumbnail.isLeaving,
  );

  const thumbnailLayer = (
    <div className={styles.thumbnailWrapper} aria-hidden="true">
      {hoverThumbnails.map((thumbnail) => {
        const thumbnailStyle: ThumbnailStyle = {
          '--thumbnail-landscape-column': `${thumbnail.landscapeColumn}`,
          '--thumbnail-landscape-row': `${thumbnail.landscapeRow}`,
          '--thumbnail-landscape-overlap-x':
            thumbnail.landscapeColumn > 1 ? 'var(--border-width)' : '0px',
          '--thumbnail-landscape-overlap-y':
            thumbnail.landscapeRow > 1 ? 'var(--border-width)' : '0px',
          '--thumbnail-portrait-column': `${thumbnail.portraitColumn}`,
          '--thumbnail-portrait-row': `${thumbnail.portraitRow}`,
          '--thumbnail-portrait-overlap-x':
            thumbnail.portraitColumn > 1 ? 'var(--border-width)' : '0px',
          '--thumbnail-portrait-overlap-y':
            thumbnail.portraitRow > 1 ? 'var(--border-width)' : '0px',
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
                sizes="(orientation: portrait) 50vw, 25vw"
                loading="eager"
                quality={70}
                unoptimized
              />
            </div>
          </div>
        );
      })}
      <div
        className={`${styles.gridLineLayer} ${
          hasActiveThumbnails
            ? styles.gridLineLayerVisible
            : hasVisibleThumbnails
              ? styles.gridLineLayerLeaving
              : ''
        }`}
      >
        {Array.from({ length: GRID_SLOT_COUNT }, (_, index) => (
          <div key={index} className={styles.gridLineCell} />
        ))}
      </div>
      {children}
    </div>
  );

  return portalTarget ? createPortal(thumbnailLayer, portalTarget) : null;
}
