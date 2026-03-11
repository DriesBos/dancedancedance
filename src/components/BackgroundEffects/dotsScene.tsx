import { useEffect, useMemo, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  createParallaxTween,
  retargetParallaxTween,
  sampleParallaxTween,
  snapParallaxTween,
} from './parallaxEasing';
import { createAdaptiveDprController } from './adaptiveDpr';

type DotsSceneProps = {
  backgroundColor: string;
  dotColors: string[];
  dotSize: number;
  densityScale?: number;
  drawBackground?: boolean;
  className?: string;
  scrollProgressRef: MutableRefObject<number>;
  disableInputs?: boolean;
  active?: boolean;
};

type DotParticle = {
  baseX: number;
  baseY: number;
  baseZ: number;
};

const DOTS_PARALLAX_REFERENCE_WIDTH_PX = 1440;
const DOTS_PARALLAX_MIN_SCALE = 0.7;
const DOTS_PARALLAX_MAX_SCALE = 1.35;
const DOTS_MIN_DPR = 0.75;
const DOTS_MAX_DPR = 1.2;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getDotsParallaxScale(viewportWidth: number): number {
  return clamp(
    viewportWidth / DOTS_PARALLAX_REFERENCE_WIDTH_PX,
    DOTS_PARALLAX_MIN_SCALE,
    DOTS_PARALLAX_MAX_SCALE,
  );
}

function getDotsDprBounds() {
  const deviceDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const maxDpr = Math.min(deviceDpr, DOTS_MAX_DPR);
  const minDpr = Math.min(DOTS_MIN_DPR, maxDpr);

  return { minDpr, maxDpr };
}

function DotsField({
  dotColors,
  dotSize,
  densityScale = 1,
  lockToInitialViewport = false,
  countScale = 1,
}: {
  dotColors: string[];
  dotSize: number;
  densityScale?: number;
  lockToInitialViewport?: boolean;
  countScale?: number;
}) {
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const initialViewportRef = useRef<{ width: number; height: number } | null>(
    null,
  );
  const dotTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, 64, 64);
      context.fillStyle = '#ffffff';
      context.beginPath();
      context.arc(32, 32, 28, 0, Math.PI * 2);
      context.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }, []);
  const { viewport } = useThree();
  const liveViewportWidth = viewport.width;
  const liveViewportHeight = viewport.height;

  if (
    lockToInitialViewport &&
    !initialViewportRef.current &&
    liveViewportWidth > 0 &&
    liveViewportHeight > 0
  ) {
    initialViewportRef.current = {
      width: liveViewportWidth,
      height: liveViewportHeight,
    };
  }

  const viewportWidth = lockToInitialViewport
    ? (initialViewportRef.current?.width ?? liveViewportWidth)
    : liveViewportWidth;
  const viewportHeight = lockToInitialViewport
    ? (initialViewportRef.current?.height ?? liveViewportHeight)
    : liveViewportHeight;

  const dotCount = useMemo(() => {
    const clampedDensityScale = clamp(densityScale, 0.05, 1.5);
    const clampedCountScale = clamp(countScale, 0.2, 1);
    const minCount = Math.max(6, Math.round(90 * clampedDensityScale));
    const maxCount = Math.max(minCount, Math.round(270 * clampedDensityScale));
    const count = Math.round(
      viewportWidth * viewportHeight * 4.2 * clampedDensityScale,
    );
    const baseCount = clamp(count, minCount, maxCount);
    const scaledMinCount = Math.max(
      3,
      Math.round(minCount * clampedCountScale),
    );
    const scaledMaxCount = Math.max(
      scaledMinCount,
      Math.round(maxCount * clampedCountScale),
    );
    const scaledCount = Math.round(baseCount * clampedCountScale);

    return clamp(scaledCount, scaledMinCount, scaledMaxCount);
  }, [countScale, densityScale, viewportHeight, viewportWidth]);
  const positions = useMemo(() => new Float32Array(dotCount * 3), [dotCount]);
  const colors = useMemo(() => new Float32Array(dotCount * 3), [dotCount]);

  const particles = useMemo<DotParticle[]>(() => {
    const spreadX = viewportWidth * 0.56;
    const spreadY = viewportHeight * 0.56;

    return Array.from({ length: dotCount }, () => ({
      baseX: THREE.MathUtils.randFloatSpread(spreadX * 2),
      baseY: THREE.MathUtils.randFloatSpread(spreadY * 2),
      baseZ: THREE.MathUtils.randFloatSpread(20),
    }));
  }, [dotCount, viewportHeight, viewportWidth]);

  useEffect(() => {
    const geometry = geometryRef.current;
    if (!geometry) return;

    const palette = dotColors.length > 0 ? dotColors : ['#ffffff'];
    const fallbackColor = new THREE.Color('#ffffff');
    for (let index = 0; index < dotCount; index += 1) {
      const particle = particles[index];
      const paletteColor = new THREE.Color(palette[index % palette.length]);
      const resolvedColor = Number.isFinite(paletteColor.r)
        ? paletteColor
        : fallbackColor;
      const cursor = index * 3;
      positions[cursor] = particle.baseX;
      positions[cursor + 1] = particle.baseY;
      positions[cursor + 2] = particle.baseZ;
      colors[cursor] = resolvedColor.r;
      colors[cursor + 1] = resolvedColor.g;
      colors[cursor + 2] = resolvedColor.b;
    }

    const positionAttribute = new THREE.BufferAttribute(positions, 3);
    positionAttribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', positionAttribute);
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeBoundingSphere();
  }, [colors, dotColors, dotCount, particles, positions]);

  useEffect(() => {
    return () => {
      dotTexture.dispose();
    };
  }, [dotTexture]);

  return (
    <>
      <points frustumCulled={false}>
        <bufferGeometry ref={geometryRef} />
        <pointsMaterial
          vertexColors
          size={dotSize}
          sizeAttenuation
          map={dotTexture}
          alphaMap={dotTexture}
          alphaTest={0.5}
          transparent
          opacity={0.95}
          depthWrite={false}
          toneMapped={false}
        />
      </points>
    </>
  );
}

function CameraRig({
  scrollProgressRef,
  enableParallax = true,
  active = true,
}: {
  scrollProgressRef: MutableRefObject<number>;
  enableParallax?: boolean;
  active?: boolean;
}) {
  const { camera, invalidate } = useThree();
  const pointerTweenRef = useRef({
    x: createParallaxTween(0),
    y: createParallaxTween(0),
  });
  const previousTransformRef = useRef({
    x: 0,
    y: 0,
    z: 28,
    rotationX: 0,
    rotationY: 0,
  });
  const tuning = {
    maxOffsetX: 2.8,
    maxOffsetY: 1.6,
    maxYaw: THREE.MathUtils.degToRad(2),
    maxPitch: THREE.MathUtils.degToRad(1.2),
    depthPush: 0.35,
    scrollTravelY: 3,
  };

  useEffect(() => {
    if (!active || !enableParallax) {
      snapParallaxTween(pointerTweenRef.current.x, 0);
      snapParallaxTween(pointerTweenRef.current.y, 0);
      invalidate();
      return;
    }

    const updatePointer = (clientX: number, clientY: number) => {
      const viewportWidth = Math.max(1, window.innerWidth);
      const viewportHeight = Math.max(1, window.innerHeight);
      // Matches Shopify's `x / width - 0.5` coordinate space.
      const normalizedX = clientX / viewportWidth - 0.5;
      const normalizedY = clientY / viewportHeight - 0.5;
      const nextX = clamp(normalizedX, -1, 1);
      const nextY = clamp(normalizedY, -1, 1);
      const nowMs = performance.now();

      retargetParallaxTween(pointerTweenRef.current.x, nextX, nowMs);
      retargetParallaxTween(pointerTweenRef.current.y, nextY, nowMs);
      invalidate();
    };

    const handlePointerMove = (event: PointerEvent) => {
      updatePointer(event.clientX, event.clientY);
    };

    const handleMouseMove = (event: MouseEvent) => {
      updatePointer(event.clientX, event.clientY);
    };

    const resetPointer = () => {
      const nowMs = performance.now();
      retargetParallaxTween(pointerTweenRef.current.x, 0, nowMs);
      retargetParallaxTween(pointerTweenRef.current.y, 0, nowMs);
      invalidate();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('blur', resetPointer);
    document.addEventListener('mouseleave', resetPointer);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('blur', resetPointer);
      document.removeEventListener('mouseleave', resetPointer);
    };
  }, [active, enableParallax, invalidate]);

  useEffect(() => {
    if (!active || !enableParallax) return;

    const requestRender = () => {
      invalidate();
    };

    window.addEventListener('scroll', requestRender, { passive: true });
    window.addEventListener('orientationchange', requestRender, {
      passive: true,
    });
    window.addEventListener('resize', requestRender, { passive: true });

    return () => {
      window.removeEventListener('scroll', requestRender);
      window.removeEventListener('orientationchange', requestRender);
      window.removeEventListener('resize', requestRender);
    };
  }, [active, enableParallax, invalidate]);

  useFrame(() => {
    if (!active) return;

    const prev = previousTransformRef.current;
    const nowMs = performance.now();
    const pointerX = enableParallax
      ? sampleParallaxTween(pointerTweenRef.current.x, nowMs)
      : 0;
    const pointerY = enableParallax
      ? sampleParallaxTween(pointerTweenRef.current.y, nowMs)
      : 0;
    const viewportWidth =
      typeof window !== 'undefined'
        ? window.innerWidth
        : DOTS_PARALLAX_REFERENCE_WIDTH_PX;
    const viewportScale = getDotsParallaxScale(viewportWidth);
    const targetOffsetX = -pointerX * tuning.maxOffsetX * viewportScale;
    const targetOffsetY = -pointerY * tuning.maxOffsetY * viewportScale;
    const interaction = clamp(Math.hypot(pointerX, pointerY) / 0.75, 0, 1);
    const targetZ = 28 - interaction * tuning.depthPush * viewportScale;

    const progress = clamp(scrollProgressRef.current, 0, 1);
    const travelY = tuning.scrollTravelY * viewportScale;
    const targetY = -progress * travelY + targetOffsetY;

    camera.position.x = targetOffsetX;
    camera.position.y = targetY;
    camera.position.z = targetZ;
    camera.rotation.y = pointerX * tuning.maxYaw * viewportScale;
    camera.rotation.x = -pointerY * tuning.maxPitch * viewportScale;
    camera.rotation.z = 0;

    const positionDelta =
      Math.abs(camera.position.x - prev.x) +
      Math.abs(camera.position.y - prev.y) +
      Math.abs(camera.position.z - prev.z);
    const rotationDelta =
      Math.abs(camera.rotation.x - prev.rotationX) +
      Math.abs(camera.rotation.y - prev.rotationY);
    const tweenDistance =
      Math.abs(pointerTweenRef.current.x.to - pointerX) +
      Math.abs(pointerTweenRef.current.y.to - pointerY);

    previousTransformRef.current = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
      rotationX: camera.rotation.x,
      rotationY: camera.rotation.y,
    };

    if (positionDelta > 1e-5 || rotationDelta > 1e-5 || tweenDistance > 1e-4) {
      invalidate();
    }
  });

  return null;
}

function InvalidateOnSceneChange({
  active,
  backgroundColor,
  dotColors,
  dotSize,
  densityScale,
  disableInputs,
}: {
  active: boolean;
  backgroundColor: string;
  dotColors: string[];
  dotSize: number;
  densityScale: number;
  disableInputs: boolean;
}) {
  const { invalidate } = useThree();

  useEffect(() => {
    if (!active) return;
    invalidate();
  }, [
    active,
    backgroundColor,
    dotColors,
    dotSize,
    densityScale,
    disableInputs,
    invalidate,
  ]);

  return null;
}

function AdaptiveDotsDprRig({ active }: { active: boolean }) {
  const { setDpr, invalidate } = useThree();
  const dprControllerRef = useRef(
    createAdaptiveDprController({
      minDpr: DOTS_MIN_DPR,
      maxDpr: DOTS_MAX_DPR,
      initialDpr: DOTS_MAX_DPR,
      step: 0.05,
      lowerFpsThreshold: 46,
      upperFpsThreshold: 57,
      minSamplesBeforeAdjust: 18,
      cooldownMs: 1200,
    }),
  );
  const currentDprRef = useRef(DOTS_MAX_DPR);

  useEffect(() => {
    const syncDprBounds = () => {
      const nowMs = performance.now();
      const { minDpr, maxDpr } = getDotsDprBounds();
      const nextDpr = dprControllerRef.current.setBounds(minDpr, maxDpr, nowMs);

      if (Math.abs(nextDpr - currentDprRef.current) <= 1e-4) {
        return;
      }

      currentDprRef.current = nextDpr;
      setDpr(nextDpr);
      invalidate();
    };

    syncDprBounds();

    window.addEventListener('resize', syncDprBounds, { passive: true });
    window.addEventListener('orientationchange', syncDprBounds, {
      passive: true,
    });

    return () => {
      window.removeEventListener('resize', syncDprBounds);
      window.removeEventListener('orientationchange', syncDprBounds);
    };
  }, [invalidate, setDpr]);

  useEffect(() => {
    dprControllerRef.current.reset(performance.now());
  }, [active]);

  useFrame(() => {
    if (!active) return;

    const next = dprControllerRef.current.observeFrame(performance.now());
    if (!next?.nextDpr) return;
    if (Math.abs(next.nextDpr - currentDprRef.current) <= 1e-4) return;

    currentDprRef.current = next.nextDpr;
    setDpr(next.nextDpr);
    invalidate();
  });

  return null;
}

export default function DotsScene({
  backgroundColor,
  dotColors,
  dotSize,
  densityScale = 1,
  drawBackground = true,
  className,
  scrollProgressRef,
  disableInputs = false,
  active = true,
}: DotsSceneProps) {
  const countScale = disableInputs ? 0.5 : 1;
  const initialDpr = getDotsDprBounds().maxDpr;

  return (
    <Canvas
      className={className}
      frameloop="demand"
      camera={{ fov: 48, near: 0.1, far: 120, position: [0, 0, 28] }}
      dpr={initialDpr}
      resize={{ scroll: false, debounce: { scroll: 0, resize: 200 } }}
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: 'high-performance',
      }}
    >
      <AdaptiveDotsDprRig active={active} />
      <InvalidateOnSceneChange
        active={active}
        backgroundColor={backgroundColor}
        dotColors={dotColors}
        dotSize={dotSize}
        densityScale={densityScale}
        disableInputs={disableInputs}
      />
      {drawBackground && <color attach="background" args={[backgroundColor]} />}
      {drawBackground && <fog attach="fog" args={[backgroundColor, 20, 64]} />}
      <CameraRig
        scrollProgressRef={scrollProgressRef}
        enableParallax={!disableInputs}
        active={active}
      />
      <DotsField
        dotColors={dotColors}
        dotSize={dotSize}
        densityScale={densityScale}
        lockToInitialViewport={disableInputs}
        countScale={countScale}
      />
    </Canvas>
  );
}
