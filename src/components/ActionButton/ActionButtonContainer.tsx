'use client';

import {
  Children,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Bodies, Body, Engine, Runner, World } from 'matter-js';
import styles from './ActionButtonContainer.module.sass';

interface ActionButtonContainerProps {
  children: ReactNode;
  className?: string;
}

const SETTLE_FRAME_COUNT = 20;

const ActionButtonContainer = ({
  children,
  className = '',
}: ActionButtonContainerProps) => {
  const [isSettled, setIsSettled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const childItems = useMemo(() => Children.toArray(children), [children]);
  const childCount = childItems.length;

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

    const entries = itemElements.map((element, index) => {
      const rect = element.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const spawnPadding = 4;
      const minX = width / 2 + spawnPadding;
      const maxX = containerWidth - width / 2 - spawnPadding;
      const childRoot = element.firstElementChild as HTMLElement | null;
      const preferredLeftValue = childRoot?.getAttribute(
        'data-action-drop-left',
      );
      const preferredCenterPercentValue = childRoot?.getAttribute(
        'data-action-drop-center-percent',
      );
      const dropDelayValue = childRoot?.getAttribute('data-action-drop-delay-ms');
      const preferredLeftPx =
        preferredLeftValue === null ? Number.NaN : Number(preferredLeftValue);
      const preferredCenterPercent =
        preferredCenterPercentValue === null
          ? Number.NaN
          : Number(preferredCenterPercentValue);
      const dropDelayMs =
        dropDelayValue === null ? 0 : Math.max(0, Number(dropDelayValue) || 0);
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

      const initialAngularVelocity = (Math.random() - 0.5) * 0.02;
      Body.setAngle(body, (Math.random() - 0.5) * 0.16);
      Body.setStatic(body, true);
      World.add(engine.world, body);

      return {
        body,
        element,
        width,
        height,
        dropDelayMs,
        initialAngularVelocity,
        activated: false,
      };
    });

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
        entries.forEach(({ body }) => {
          Body.setVelocity(body, { x: 0, y: 0 });
          Body.setAngularVelocity(body, 0);
          Body.setStatic(body, true);
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
  }, [childCount]);

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
