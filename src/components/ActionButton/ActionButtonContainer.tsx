'use client';

import {
  Children,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import { Bodies, Body, Engine, Runner, Sleeping, World } from 'matter-js';
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
  dropDelayMs: number;
  initialAngularVelocity: number;
  activated: boolean;
}

interface PersistedItemState {
  x: number;
  y: number;
  angle: number;
  width: number;
  height: number;
}

const SETTLE_FRAME_COUNT = 20;

const ActionButtonContainer = ({
  children,
  className = '',
}: ActionButtonContainerProps) => {
  const [isSettled, setIsSettled] = useState(false);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const persistedTransformsRef = useRef<Map<number, PersistedItemState>>(
    new Map(),
  );
  const lastKnownSizeRef = useRef<{ width: number; height: number } | null>(
    null,
  );
  const pathname = usePathname() || '/';
  const pageSlug = pathname.split('/')[1] || 'home';
  const childItems = useMemo(() => Children.toArray(children), [children]);
  const childCount = childItems.length;

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

    setIsSettled(false);

    const engine = Engine.create();
    engine.enableSleeping = true;
    engine.gravity.y = 1;
    engine.gravity.scale = 0.0012;

    const runner = Runner.create();
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

    const entries = itemElements
      .map((element, index): PhysicsEntry | null => {
        const persistedState = persistedTransformsRef.current.get(index);
        if (persistedState) {
          const { x, y, angle, width: persistedWidth, height: persistedHeight } =
            persistedState;
          element.style.opacity = '1';
          element.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${angle}rad)`;

          // Rebuild settled items as static physics bodies so new drops collide.
          const persistedBody = Bodies.rectangle(
            x + persistedWidth / 2,
            y + persistedHeight / 2,
            persistedWidth,
            persistedHeight,
            {
              isStatic: true,
              restitution: 0.1,
              friction: 0.8,
            },
          );
          Body.setAngle(persistedBody, angle);
          World.add(engine.world, persistedBody);
          return null;
        }

        const rect = element.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const spawnPadding = 4;
        const minX = width / 2 + spawnPadding;
        const maxX = containerWidth - width / 2 - spawnPadding;
        const childRoot = element.firstElementChild as HTMLElement | null;
        const dropPage = childRoot?.getAttribute('data-action-drop-page');

        if (dropPage && dropPage !== pageSlug) {
          element.style.opacity = '0';
          element.style.transform = 'translate3d(-200vw, -200vh, 0)';
          return null;
        }

        element.style.opacity = '1';

        const preferredLeftValue = childRoot?.getAttribute(
          'data-action-drop-left',
        );
        const preferredCenterPercentValue = childRoot?.getAttribute(
          'data-action-drop-center-percent',
        );
        const dropDelayValue = childRoot?.getAttribute(
          'data-action-drop-delay-ms',
        );
        const preferredLeftPx =
          preferredLeftValue === null ? Number.NaN : Number(preferredLeftValue);
        const preferredCenterPercent =
          preferredCenterPercentValue === null
            ? Number.NaN
            : Number(preferredCenterPercentValue);
        const dropDelayMs =
          dropDelayValue === null ? 0 : Math.max(0, Number(dropDelayValue) || 0);
        const hasPreferredLeft = Number.isFinite(preferredLeftPx);
        const hasPreferredCenterPercent = Number.isFinite(
          preferredCenterPercent,
        );
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

        const initialAngularVelocity = (Math.random() - 0.5) * 0.02;
        Body.setAngle(body, (Math.random() - 0.5) * 0.16);
        Body.setStatic(body, true);
        World.add(engine.world, body);

        return {
          index,
          body,
          element,
          width,
          height,
          dropDelayMs,
          initialAngularVelocity,
          activated: false,
        };
      })
      .filter((entry): entry is PhysicsEntry => entry !== null);

    if (entries.length === 0) {
      setIsSettled(true);
      return () => {
        Runner.stop(runner);
        World.clear(engine.world, false);
        Engine.clear(engine);
      };
    }

    Runner.run(runner, engine);

    let settleFrames = 0;
    let rafId = 0;
    const startTime = performance.now();
    const renderFrame = () => {
      const elapsedMs = performance.now() - startTime;
      let allBodiesActivated = true;
      let allBodiesSleeping = true;

      entries.forEach((entry) => {
        const { body, element, width, height } = entry;

        if (!entry.activated && elapsedMs >= entry.dropDelayMs) {
          Body.setStatic(body, false);
          Sleeping.set(body, false);
          Body.setVelocity(body, { x: 0, y: 0.01 });
          Body.setAngularVelocity(body, entry.initialAngularVelocity);
          entry.activated = true;
        }

        if (!entry.activated) {
          allBodiesActivated = false;
          allBodiesSleeping = false;
        }

        const x = body.position.x - width / 2;
        const y = body.position.y - height / 2;
        element.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${body.angle}rad)`;

        if (entry.activated && !body.isSleeping) {
          allBodiesSleeping = false;
        }
      });

      if (allBodiesActivated && allBodiesSleeping) {
        settleFrames += 1;
      } else {
        settleFrames = 0;
      }

      if (settleFrames >= SETTLE_FRAME_COUNT) {
        entries.forEach(({ index, body, element, width, height }) => {
          Body.setVelocity(body, { x: 0, y: 0 });
          Body.setAngularVelocity(body, 0);
          Body.setStatic(body, true);
          const finalX = body.position.x - width / 2;
          const finalY = body.position.y - height / 2;
          const finalAngle = body.angle;
          element.style.transform = `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalAngle}rad)`;
          persistedTransformsRef.current.set(index, {
            x: finalX,
            y: finalY,
            angle: finalAngle,
            width,
            height,
          });
        });
        Runner.stop(runner);
        setIsSettled(true);
        return;
      }

      rafId = window.requestAnimationFrame(renderFrame);
    };

    rafId = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(rafId);
      Runner.stop(runner);
      World.clear(engine.world, false);
      Engine.clear(engine);
    };
  }, [childCount, pathname, pageSlug, layoutVersion]);

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
