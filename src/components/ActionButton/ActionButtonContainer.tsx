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
import type { Body, Engine, Runner } from 'matter-js';
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

type MatterJsModule = typeof import('matter-js');

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
  const [hasCompletedDrops, setHasCompletedDrops] = useState(false);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [matterModule, setMatterModule] = useState<MatterJsModule | null>(null);
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
  const shouldRenderOnRoute =
    pageSlug === 'home' || pageSlug === 'about' || pageSlug === 'projects';
  const shouldActivatePhysics =
    shouldRenderOnRoute && isNearViewport && !hasCompletedDrops;
  const childItems = useMemo(() => Children.toArray(children), [children]);
  const childCount = childItems.length;

  useEffect(() => {
    if (!shouldRenderOnRoute) {
      setIsNearViewport(false);
      return;
    }
    if (isNearViewport) return;

    const container = containerRef.current;
    if (!container) return;
    if (typeof IntersectionObserver !== 'function') {
      setIsNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const hasIntersectingEntry = entries.some((entry) => entry.isIntersecting);
        if (!hasIntersectingEntry) return;
        setIsNearViewport(true);
        observer.disconnect();
      },
      {
        rootMargin: '240px 0px',
      },
    );

    observer.observe(container);
    return () => {
      observer.disconnect();
    };
  }, [isNearViewport, shouldRenderOnRoute]);

  useEffect(() => {
    if (!shouldActivatePhysics) {
      setMatterModule(null);
      return;
    }

    let isCancelled = false;

    const loadMatter = async () => {
      const matterLib = await import('matter-js');
      if (!isCancelled) {
        setMatterModule(matterLib);
      }
    };

    loadMatter();

    return () => {
      isCancelled = true;
    };
  }, [shouldActivatePhysics]);

  const setSettledState = useCallback((nextValue: boolean) => {
    if (latestSettledRef.current === nextValue) return;
    latestSettledRef.current = nextValue;
    setIsSettled(nextValue);
  }, []);

  useEffect(() => {
    if (hasCompletedDrops) return;
    if (!isSettled) return;
    if (childCount === 0) return;
    if (spawnedIndicesRef.current.size < childCount) return;
    setHasCompletedDrops(true);
  }, [childCount, hasCompletedDrops, isSettled]);

  const stopSimulation = useCallback(() => {
    const matter = matterModule;
    if (rafIdRef.current !== null) {
      window.cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (runnerRef.current && matter) {
      matter.Runner.stop(runnerRef.current);
    }
  }, [matterModule]);

  const startRenderLoop = useCallback(() => {
    const matter = matterModule;
    if (!matter) return;
    if (rafIdRef.current !== null) return;

    const renderFrame = () => {
      if (document.hidden) {
        stopSimulation();
        return;
      }

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
          matter.Body.setVelocity(body, { x: 0, y: 0 });
          matter.Body.setAngularVelocity(body, 0);
          matter.Body.setStatic(body, true);

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

      if (activeEntries.length === 0) {
        setSettledState(true);
        if (runnerRef.current) {
          matter.Runner.stop(runnerRef.current);
        }
        rafIdRef.current = null;
        return;
      }

      setSettledState(false);
      rafIdRef.current = window.requestAnimationFrame(renderFrame);
    };

    rafIdRef.current = window.requestAnimationFrame(renderFrame);
  }, [matterModule, setSettledState, stopSimulation]);

  const startSimulation = useCallback(() => {
    const matter = matterModule;
    const engine = engineRef.current;
    const runner = runnerRef.current;
    if (!matter || !engine || !runner) return;
    if (document.hidden) return;
    if (rafIdRef.current !== null) return;

    matter.Runner.run(runner, engine);
    startRenderLoop();
  }, [matterModule, startRenderLoop]);

  const spawnEntry = useCallback(
    (index: number, element: HTMLDivElement, containerWidth: number) => {
      const engine = engineRef.current;
      const matter = matterModule;
      if (!engine || !matter) return;

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

      const body = matter.Bodies.rectangle(spawnX, spawnY, width, height, {
        restitution: 0.33,
        friction: 0.5,
        frictionAir: 0.01,
        sleepThreshold: 40,
      });

      matter.Body.setAngle(body, (Math.random() - 0.5) * 0.16);
      matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.02);
      matter.World.add(engine.world, body);

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
      startSimulation();
    },
    [matterModule, setSettledState, startSimulation],
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

  useEffect(() => {
    if (!shouldActivatePhysics) return;

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
  }, [shouldActivatePhysics]);

  useEffect(() => {
    if (!shouldActivatePhysics || !matterModule) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopSimulation();
        return;
      }
      if (activeEntriesRef.current.length > 0) {
        startSimulation();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [matterModule, shouldActivatePhysics, startSimulation, stopSimulation]);

  useEffect(() => {
    if (!shouldActivatePhysics || !matterModule) return;

    const container = containerRef.current;
    const itemElements = itemRefs.current
      .slice(0, childCount)
      .filter((element): element is HTMLDivElement => !!element);

    if (!container || itemElements.length === 0) return;

    const { Bodies, Body, Engine, Runner, World } = matterModule;

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

    if (activeEntriesRef.current.length > 0) {
      startSimulation();
    } else {
      stopSimulation();
    }

    return () => {
      stopSimulation();
      Runner.stop(runner);
      runnerRef.current = null;
      World.clear(engine.world, false);
      Engine.clear(engine);
      engineRef.current = null;
      activeEntriesRef.current = [];
    };
  }, [
    childCount,
    layoutVersion,
    matterModule,
    setSettledState,
    shouldActivatePhysics,
    spawnEntry,
    startSimulation,
    stopSimulation,
  ]);

  useEffect(() => {
    if (!shouldActivatePhysics || !matterModule) return;
    if (spawnedIndicesRef.current.size >= childCount) return;
    spawnEligibleForRoute(pageSlug);
  }, [
    childCount,
    matterModule,
    pageSlug,
    shouldActivatePhysics,
    spawnEligibleForRoute,
  ]);

  if (!shouldRenderOnRoute) {
    return null;
  }

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
