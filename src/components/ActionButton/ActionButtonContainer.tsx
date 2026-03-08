'use client';

import {
  Children,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import { Bodies, Body, Engine, Runner, World } from 'matter-js';
import styles from './ActionButtonContainer.module.sass';

interface ActionButtonContainerProps {
  children: ReactNode;
  className?: string;
}

interface PhysicsEntry {
  index: number;
  body: Body;
  element: HTMLDivElement;
  width: number;
  height: number;
  sleepFrames: number;
}

interface PersistedItemState {
  x: number;
  y: number;
  angle: number;
  width: number;
  height: number;
}

const SETTLE_FRAME_COUNT = 20;

const hideElement = (element: HTMLDivElement) => {
  element.style.opacity = '0';
  element.style.transform = 'translate3d(-200vw, -200vh, 0)';
};

const showElement = (element: HTMLDivElement) => {
  element.style.opacity = '1';
};

const ActionButtonContainer = ({
  children,
  className = '',
}: ActionButtonContainerProps) => {
  const [isSettled, setIsSettled] = useState(false);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const engineRef = useRef<Engine | null>(null);
  const runnerRef = useRef<Runner | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const activeEntriesRef = useRef<PhysicsEntry[]>([]);
  const spawnedIndicesRef = useRef<Set<number>>(new Set());
  const latestSettledRef = useRef(true);
  const persistedStatesRef = useRef<Map<number, PersistedItemState>>(new Map());
  const lastKnownSizeRef = useRef<{ width: number; height: number } | null>(
    null,
  );
  const pathname = usePathname() || '/';
  const pageSlug = pathname.split('/')[1] || 'home';
  const childItems = useMemo(() => Children.toArray(children), [children]);
  const childCount = childItems.length;

  const setSettledState = useCallback((nextValue: boolean) => {
    if (latestSettledRef.current === nextValue) return;
    latestSettledRef.current = nextValue;
    setIsSettled(nextValue);
  }, []);

  const spawnEntry = useCallback(
    (index: number, element: HTMLDivElement, containerWidth: number) => {
      const engine = engineRef.current;
      if (!engine) return;

      const rect = element.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const spawnPadding = 4;
      const minX = width / 2 + spawnPadding;
      const maxX = containerWidth - width / 2 - spawnPadding;
      const childRoot = element.firstElementChild as HTMLElement | null;
      const preferredLeftValue = childRoot?.getAttribute('data-action-drop-left');
      const preferredCenterPercentValue = childRoot?.getAttribute(
        'data-action-drop-center-percent',
      );
      const preferredLeftPx =
        preferredLeftValue === null ? Number.NaN : Number(preferredLeftValue);
      const preferredCenterPercent =
        preferredCenterPercentValue === null
          ? Number.NaN
          : Number(preferredCenterPercentValue);
      const hasPreferredLeft = Number.isFinite(preferredLeftPx);
      const hasPreferredCenterPercent = Number.isFinite(preferredCenterPercent);
      const randomSpawnX = minX + Math.random() * Math.max(1, maxX - minX);
      const preferredCenterX = hasPreferredCenterPercent
        ? (containerWidth * preferredCenterPercent) / 100
        : Number.NaN;
      const spawnX = hasPreferredLeft
        ? Math.min(maxX, Math.max(minX, preferredLeftPx + width / 2))
        : hasPreferredCenterPercent
          ? Math.min(maxX, Math.max(minX, preferredCenterX))
          : randomSpawnX;
      const spawnY = -height - index * (height + 16);

      const body = Bodies.rectangle(spawnX, spawnY, width, height, {
        restitution: 0.33,
        friction: 0.5,
        frictionAir: 0.01,
        sleepThreshold: 40,
      });

      Body.setAngle(body, (Math.random() - 0.5) * 0.16);
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.02);
      World.add(engine.world, body);

      activeEntriesRef.current.push({
        index,
        body,
        element,
        width,
        height,
        sleepFrames: 0,
      });
      spawnedIndicesRef.current.add(index);
      showElement(element);
      setSettledState(false);
    },
    [setSettledState],
  );

  const spawnEligibleForRoute = useCallback(
    (routeSlug: string) => {
      const container = containerRef.current;
      const engine = engineRef.current;
      if (!container || !engine) return;

      const containerWidth = container.getBoundingClientRect().width;
      const itemElements = itemRefs.current
        .slice(0, childCount)
        .filter((element): element is HTMLDivElement => !!element);

      itemElements.forEach((element, index) => {
        if (spawnedIndicesRef.current.has(index)) return;

        const childRoot = element.firstElementChild as HTMLElement | null;
        const dropPage = childRoot?.getAttribute('data-action-drop-page');
        if (dropPage && dropPage !== routeSlug) {
          hideElement(element);
          return;
        }

        spawnEntry(index, element, containerWidth);
      });
    },
    [childCount, spawnEntry],
  );

  const startRenderLoop = useCallback(() => {
    const renderFrame = () => {
      const activeEntries = activeEntriesRef.current;

      for (let index = activeEntries.length - 1; index >= 0; index -= 1) {
        const entry = activeEntries[index];
        const { body, element, width, height } = entry;

        const x = body.position.x - width / 2;
        const y = body.position.y - height / 2;
        element.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${body.angle}rad)`;

        if (body.isSleeping) {
          entry.sleepFrames += 1;
        } else {
          entry.sleepFrames = 0;
        }

        if (entry.sleepFrames >= SETTLE_FRAME_COUNT) {
          Body.setVelocity(body, { x: 0, y: 0 });
          Body.setAngularVelocity(body, 0);
          Body.setStatic(body, true);

          const finalX = body.position.x - width / 2;
          const finalY = body.position.y - height / 2;
          const finalAngle = body.angle;
          element.style.transform = `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalAngle}rad)`;
          persistedStatesRef.current.set(entry.index, {
            x: finalX,
            y: finalY,
            angle: finalAngle,
            width,
            height,
          });

          activeEntries.splice(index, 1);
        }
      }

      setSettledState(activeEntries.length === 0);
      rafIdRef.current = window.requestAnimationFrame(renderFrame);
    };

    rafIdRef.current = window.requestAnimationFrame(renderFrame);
  }, [setSettledState]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let resizeRafId = 0;
    const syncContainerSize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      const previous = lastKnownSizeRef.current;

      if (!previous) {
        lastKnownSizeRef.current = { width, height };
        return;
      }

      if (previous.width !== width || previous.height !== height) {
        lastKnownSizeRef.current = { width, height };
        setLayoutVersion((value) => value + 1);
      }
    };

    const requestSizeSync = () => {
      if (resizeRafId !== 0) {
        window.cancelAnimationFrame(resizeRafId);
      }
      resizeRafId = window.requestAnimationFrame(() => {
        resizeRafId = 0;
        syncContainerSize();
      });
    };

    syncContainerSize();

    const observer =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(requestSizeSync)
        : null;
    observer?.observe(container);

    window.addEventListener('resize', requestSizeSync);

    return () => {
      window.removeEventListener('resize', requestSizeSync);
      observer?.disconnect();
      if (resizeRafId !== 0) {
        window.cancelAnimationFrame(resizeRafId);
      }
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const itemElements = itemRefs.current
      .slice(0, childCount)
      .filter((element): element is HTMLDivElement => !!element);

    if (!container || itemElements.length === 0) return;

    setSettledState(true);
    activeEntriesRef.current = [];

    if (rafIdRef.current !== null) {
      window.cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (runnerRef.current) {
      Runner.stop(runnerRef.current);
      runnerRef.current = null;
    }
    if (engineRef.current) {
      World.clear(engineRef.current.world, false);
      Engine.clear(engineRef.current);
      engineRef.current = null;
    }

    const engine = Engine.create();
    engine.enableSleeping = true;
    engine.gravity.y = 1;
    engine.gravity.scale = 0.0018;
    engineRef.current = engine;

    const runner = Runner.create();
    runnerRef.current = runner;

    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    const wallThickness = 32;

    const staticSurfaceOptions = {
      isStatic: true,
      restitution: 0.1,
      friction: 0.8,
    };

    const floor = Bodies.rectangle(
      containerWidth / 2,
      containerHeight + wallThickness / 2,
      containerWidth + wallThickness * 2,
      wallThickness,
      staticSurfaceOptions,
    );
    const leftWall = Bodies.rectangle(
      -wallThickness / 2,
      containerHeight / 2,
      wallThickness,
      containerHeight * 2,
      staticSurfaceOptions,
    );
    const rightWall = Bodies.rectangle(
      containerWidth + wallThickness / 2,
      containerHeight / 2,
      wallThickness,
      containerHeight * 2,
      staticSurfaceOptions,
    );

    World.add(engine.world, [floor, leftWall, rightWall]);

    itemElements.forEach((element, index) => {
      const persistedState = persistedStatesRef.current.get(index);
      if (!persistedState) return;

      const { x, y, angle, width, height } = persistedState;
      showElement(element);
      element.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${angle}rad)`;

      const persistedBody = Bodies.rectangle(
        x + width / 2,
        y + height / 2,
        width,
        height,
        {
          isStatic: true,
          restitution: 0.1,
          friction: 0.8,
        },
      );
      Body.setAngle(persistedBody, angle);
      World.add(engine.world, persistedBody);
      spawnedIndicesRef.current.add(index);
    });

    // If an item was already triggered but wasn't settled yet (e.g. resize),
    // spawn it again regardless of current route.
    itemElements.forEach((element, index) => {
      if (persistedStatesRef.current.has(index)) return;
      if (!spawnedIndicesRef.current.has(index)) return;
      spawnEntry(index, element, containerWidth);
    });

    Runner.run(runner, engine);
    startRenderLoop();

    return () => {
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      Runner.stop(runner);
      runnerRef.current = null;
      World.clear(engine.world, false);
      Engine.clear(engine);
      engineRef.current = null;
      activeEntriesRef.current = [];
    };
  }, [childCount, layoutVersion, setSettledState, spawnEntry, startRenderLoop]);

  useEffect(() => {
    spawnEligibleForRoute(pageSlug);
  }, [pageSlug, spawnEligibleForRoute]);

  return (
    <div
      ref={containerRef}
      className={`${styles.actionButtonContainer} ${className}`.trim()}
      data-settled={isSettled}
    >
      {childItems.map((child, index) => (
        <div
          key={index}
          ref={(element) => {
            itemRefs.current[index] = element;
          }}
          className={styles.physicsItem}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

export default ActionButtonContainer;
