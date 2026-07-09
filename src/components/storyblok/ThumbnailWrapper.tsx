'use client';

import Image from 'next/image';
import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  parseStoryblokImageDimensions,
  transformStoryblokImageUrl,
  warmStoryblokImage,
} from '@/lib/storyblok-image';
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
  blendChildren?: ReactNode;
}

const HOVER_THUMBNAIL_EXIT_DURATION_MS = 300;
const HOVER_THUMBNAIL_EXIT_DELAY_MS = 950;
const HOVER_THUMBNAIL_LIFETIME_MS =
  HOVER_THUMBNAIL_EXIT_DELAY_MS + HOVER_THUMBNAIL_EXIT_DURATION_MS;
const HOVER_THUMBNAIL_DELAY_MS = 75;
const HOVER_THUMBNAIL_VIEWPORT_RATIO = 0.23;
const HOVER_THUMBNAIL_QUALITY = 55;
const HOVER_THUMBNAIL_FORMAT = 'webp';
const HOVER_THUMBNAIL_MAX_DEVICE_PIXEL_RATIO = 2;
const HOVER_THUMBNAIL_WARM_RESIZE_DELAY_MS = 150;
const HOVER_THUMBNAIL_MEDIA_QUERY = '(hover: hover) and (pointer: fine)';
const warmedHoverThumbnailSrcs = new Set<string>();

type HoverThumbnail = {
  id: number;
  projectSlug: string;
  src: string;
  alt: string;
  x: number;
  y: number;
  size: number;
  frameWidth: number;
  frameHeight: number;
  isLeaving: boolean;
  isLoaded: boolean;
  leaveEventId?: number;
};

type ThumbnailStyle = CSSProperties & {
  '--thumbnail-x': string;
  '--thumbnail-y': string;
  '--thumb-frame-width': string;
  '--thumb-frame-height': string;
};

type ThumbnailMaskStyle = CSSProperties & {
  '--thumb-mask-image': string;
  '--thumb-mask-position': string;
  '--thumb-mask-size': string;
};

const toPixels = (cssLength: string, remInPixels: number) => {
  const value = cssLength.trim();
  if (value.endsWith('rem')) return parseFloat(value) * remInPixels || 0;
  if (value.endsWith('px')) return parseFloat(value) || 0;
  return parseFloat(value) || 0;
};

const randomBetween = (min: number, max: number) =>
  min + Math.random() * (max - min);

const getProjectHoverThumbnail = (thumbnail?: ProjectData['thumbnail']) => {
  const filename = thumbnail?.filename;
  if (!filename) return undefined;

  const dimensions = parseStoryblokImageDimensions(filename);
  const aspectRatio = dimensions ? dimensions.width / dimensions.height : 4 / 3;

  return {
    filename,
    aspectRatio,
  };
};

const canUseHoverThumbnails = () =>
  window.matchMedia(HOVER_THUMBNAIL_MEDIA_QUERY).matches;

const toMilliseconds = (cssTime: string, fallback: number) => {
  const value = cssTime.trim();
  const parsed = parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (value.endsWith('ms')) return parsed;
  if (value.endsWith('s')) return parsed * 1000;
  return fallback;
};

const getThumbnailDelayMs = (element: HTMLElement | null) => {
  if (!element) return HOVER_THUMBNAIL_DELAY_MS;
  return toMilliseconds(
    getComputedStyle(element).getPropertyValue('--thumb-delay'),
    HOVER_THUMBNAIL_DELAY_MS,
  );
};

const getThumbnailLifetimeMs = (element: HTMLElement | null) => {
  if (!element) return HOVER_THUMBNAIL_LIFETIME_MS;
  const style = getComputedStyle(element);

  return (
    toMilliseconds(
      style.getPropertyValue('--thumb-exit-delay'),
      HOVER_THUMBNAIL_EXIT_DELAY_MS,
    ) +
    toMilliseconds(
      style.getPropertyValue('--thumb-exit-duration'),
      HOVER_THUMBNAIL_EXIT_DURATION_MS,
    )
  );
};

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
    viewportWidth * HOVER_THUMBNAIL_VIEWPORT_RATIO - padding,
  );

  return Math.min(viewportFit, 36 * remInPixels, preferredSize);
};

const getThumbnailViewportState = () => {
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

  return { padding, size: thumbnailSize };
};

const getRandomThumbnailPosition = () => {
  const { padding, size } = getThumbnailViewportState();
  const maxX = Math.max(padding, window.innerWidth - size - padding);
  const maxY = Math.max(padding, window.innerHeight - size - padding);

  return {
    x: randomBetween(padding, maxX),
    y: randomBetween(padding, maxY),
    size,
  };
};

const getThumbnailFrameSize = (size: number, aspectRatio: number) => {
  const isLandscapeThumbnail = aspectRatio >= 1;

  return {
    frameWidth: isLandscapeThumbnail ? size : size * aspectRatio,
    frameHeight: isLandscapeThumbnail ? size / aspectRatio : size,
  };
};

const getHoverThumbnailAssetWidth = (frameWidth: number) =>
  Math.max(
    1,
    Math.ceil(
      frameWidth *
        Math.min(
          HOVER_THUMBNAIL_MAX_DEVICE_PIXEL_RATIO,
          Math.max(1, window.devicePixelRatio || 1),
        ),
    ),
  );

const getHoverThumbnailImageSrc = (filename: string, frameWidth: number) => {
  const assetWidth = getHoverThumbnailAssetWidth(frameWidth);

  return transformStoryblokImageUrl(filename, {
    width: assetWidth,
    quality: HOVER_THUMBNAIL_QUALITY,
    format: HOVER_THUMBNAIL_FORMAT,
    noUpscale: true,
  });
};

export default function ThumbnailWrapper({
  projects,
  hoverEvent,
  leaveEvent,
  children,
  blendChildren,
}: ThumbnailWrapperProps) {
  const [hoverThumbnails, setHoverThumbnails] = useState<HoverThumbnail[]>([]);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const thumbnailIdRef = useRef(0);
  const thumbnailWrapperRef = useRef<HTMLDivElement | null>(null);
  const removeTimersRef = useRef<number[]>([]);
  const pendingHoverTimerRef = useRef<number | null>(null);
  const pendingHoverSlugRef = useRef<string | null>(null);
  const handledHoverEventIdRef = useRef<number | null>(null);
  const handledLeaveEventIdRef = useRef<number | null>(null);

  const thumbnailBySlug = useMemo(() => {
    const thumbnails = new Map<
      string,
      { filename: string; alt: string; aspectRatio: number }
    >();

    projects.forEach((project) => {
      const thumbnail = getProjectHoverThumbnail(project.thumbnail);
      if (!thumbnail) return;
      thumbnails.set(project.slug, {
        filename: thumbnail.filename,
        alt: project.thumbnail?.alt || project.title || '',
        aspectRatio: thumbnail.aspectRatio,
      });
    });

    return thumbnails;
  }, [projects]);

  const thumbnailMaskStyle = useMemo<ThumbnailMaskStyle | undefined>(() => {
    if (hoverThumbnails.length === 0) return undefined;

    const maskImage = hoverThumbnails
      .map(() => 'linear-gradient(#000 0 0)')
      .join(', ');
    const maskPosition = hoverThumbnails
      .map((thumbnail) => {
        const x = thumbnail.x + (thumbnail.size - thumbnail.frameWidth) / 2;
        const y = thumbnail.y + (thumbnail.size - thumbnail.frameHeight) / 2;
        return `${x}px ${y}px`;
      })
      .join(', ');
    const maskSize = hoverThumbnails
      .map(
        (thumbnail) =>
          `${thumbnail.frameWidth}px ${thumbnail.frameHeight}px`,
      )
      .join(', ');

    return {
      '--thumb-mask-image': maskImage,
      '--thumb-mask-position': maskPosition,
      '--thumb-mask-size': maskSize,
    };
  }, [hoverThumbnails]);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    if (!canUseHoverThumbnails() || thumbnailBySlug.size === 0) {
      return undefined;
    }

    const warmThumbnails = () => {
      const { size } = getThumbnailViewportState();

      thumbnailBySlug.forEach((thumbnail) => {
        const { frameWidth } = getThumbnailFrameSize(
          size,
          thumbnail.aspectRatio,
        );
        const assetWidth = getHoverThumbnailAssetWidth(frameWidth);

        warmStoryblokImage(
          thumbnail.filename,
          {
            width: assetWidth,
            quality: HOVER_THUMBNAIL_QUALITY,
            format: HOVER_THUMBNAIL_FORMAT,
            noUpscale: true,
          },
          warmedHoverThumbnailSrcs,
        );
      });
    };

    let resizeTimer: number | null = null;
    const scheduleWarmThumbnails = () => {
      if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
      }

      resizeTimer = window.setTimeout(() => {
        resizeTimer = null;
        warmThumbnails();
      }, HOVER_THUMBNAIL_WARM_RESIZE_DELAY_MS);
    };

    warmThumbnails();
    window.addEventListener('resize', scheduleWarmThumbnails);

    return () => {
      if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
      }
      window.removeEventListener('resize', scheduleWarmThumbnails);
    };
  }, [thumbnailBySlug]);

  useEffect(() => {
    return () => {
      if (pendingHoverTimerRef.current !== null) {
        window.clearTimeout(pendingHoverTimerRef.current);
      }
      removeTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (!hoverEvent || handledHoverEventIdRef.current === hoverEvent.id) return;
    handledHoverEventIdRef.current = hoverEvent.id;

    if (pendingHoverTimerRef.current !== null) {
      window.clearTimeout(pendingHoverTimerRef.current);
    }
    pendingHoverTimerRef.current = null;
    pendingHoverSlugRef.current = null;

    const thumbnail = thumbnailBySlug.get(hoverEvent.projectSlug);
    if (!thumbnail) return;

    pendingHoverSlugRef.current = hoverEvent.projectSlug;
    pendingHoverTimerRef.current = window.setTimeout(() => {
      pendingHoverTimerRef.current = null;
      pendingHoverSlugRef.current = null;

      const id = thumbnailIdRef.current + 1;
      thumbnailIdRef.current = id;
      const { x, y, size } = getRandomThumbnailPosition();
      const { frameWidth, frameHeight } = getThumbnailFrameSize(
        size,
        thumbnail.aspectRatio,
      );

      setHoverThumbnails((items) => [
        ...items,
        {
          id,
          projectSlug: hoverEvent.projectSlug,
          src: getHoverThumbnailImageSrc(thumbnail.filename, frameWidth),
          alt: thumbnail.alt,
          x,
          y,
          size,
          frameWidth,
          frameHeight,
          isLeaving: false,
          isLoaded: false,
        },
      ]);
    }, getThumbnailDelayMs(thumbnailWrapperRef.current));
  }, [hoverEvent, thumbnailBySlug]);

  useEffect(() => {
    if (!leaveEvent || handledLeaveEventIdRef.current === leaveEvent.id) return;
    handledLeaveEventIdRef.current = leaveEvent.id;

    if (
      pendingHoverSlugRef.current === leaveEvent.projectSlug &&
      pendingHoverTimerRef.current !== null
    ) {
      window.clearTimeout(pendingHoverTimerRef.current);
      pendingHoverTimerRef.current = null;
      pendingHoverSlugRef.current = null;
    }

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
    }, getThumbnailLifetimeMs(thumbnailWrapperRef.current));

    removeTimersRef.current.push(timer);
  }, [leaveEvent]);

  const thumbnailLayer = (
    <div
      ref={thumbnailWrapperRef}
      className={styles.thumbnailWrapper}
      aria-hidden="true"
    >
      {children}
      {hoverThumbnails.map((thumbnail) => {
        const thumbnailStyle: ThumbnailStyle = {
          '--thumbnail-x': `${thumbnail.x}px`,
          '--thumbnail-y': `${thumbnail.y}px`,
          '--thumb-frame-width': `${thumbnail.frameWidth}px`,
          '--thumb-frame-height': `${thumbnail.frameHeight}px`,
        };

        return (
          <div
            key={thumbnail.id}
            className={`${styles.thumbnailItem} ${
              thumbnail.isLeaving ? styles.thumbnailItemLeaving : ''
            }`}
            style={thumbnailStyle}
          >
            <div
              className={`${styles.thumbnailImage} ${
                thumbnail.isLoaded ? styles.thumbnailImageLoaded : ''
              }`}
            >
              <Image
                className="imageItem"
                src={thumbnail.src}
                alt={thumbnail.alt}
                fill
                sizes="(max-width: 770px) calc(100vw - var(--spacing-base) * 2), 23vw"
                loading="eager"
                fetchPriority="high"
                unoptimized
                onLoad={() => {
                  setHoverThumbnails((items) =>
                    items.map((item) =>
                      item.id === thumbnail.id
                        ? { ...item, isLoaded: true }
                        : item,
                    ),
                  );
                }}
              />
            </div>
          </div>
        );
      })}
      {blendChildren && thumbnailMaskStyle && (
        <div
          className={styles.thumbnailBlendOverlay}
          style={thumbnailMaskStyle}
        >
          {blendChildren}
        </div>
      )}
    </div>
  );

  return portalTarget ? createPortal(thumbnailLayer, portalTarget) : null;
}
