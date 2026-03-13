'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/store';
import { createAdaptiveDprController } from './adaptiveDpr';
import IntroEnterButton from './IntroEnterButton';
import styles from './NeonTunnel.module.sass';

// Length of the intro ride after pressing ENTER before page content is revealed.
// Practical tuning range: 1800ms to 4500ms.
const TUNNEL_TRAVEL_DURATION_MS = 3000;
// Camera spawn distance from the first square while the intro is waiting to start.
// Practical tuning range: 12 to 36.
const CAMERA_START_Z = 33;
// Depth gap between each square frame in the tunnel; larger values feel airier, smaller values feel denser.
// Practical tuning range: 3.5 to 7.5.
const TUNNEL_SPACING = 14;
// Extra world-space distance the camera travels past the last square so the end state lands on a clean background.
// Practical tuning range: 0 to 18.
const TUNNEL_EXIT_CLEARANCE = 0;
// Outer width/height of each square portal before glow and scaling are applied.
// Practical tuning range: 8 to 14.
const SQUARE_OUTER_SIZE = 14;
// Thickness of the square outline; this controls how graphic versus delicate the tunnel reads.
// Practical tuning range: 0.004 to 0.12.
const SQUARE_BORDER_THICKNESS = 0.01;
// Resting bloom level used during the idle background state.
// Practical tuning range: 0 to 0.5.
const BASE_BLOOM_STRENGTH = 0.5;
// Upper bloom cap used during pulses so the glow stays vivid without blowing out the whole frame.
// Practical tuning range: 0.15 to 1.2.
const MAX_BLOOM_STRENGTH = 0.28;
// Fixed tunnel density after removing the square-count control.
const SQUARE_COUNT = 10;
const MAX_SQUARE_COUNT = SQUARE_COUNT;

type RuntimeState = {
  THREE: any;
  renderer: any;
  composer: any;
  bloomPass: any;
  camera: any;
  scene: any;
  tunnelMesh: any;
  routePulseRef: { current: number };
  animationFrame: number | null;
  dispose: () => void;
  resize: () => void;
  triggerPulse: () => void;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const easeInOutCubic = (progress: number) =>
  progress < 0.5
    ? 4 * progress ** 3
    : 1 - ((-2 * progress + 2) ** 3) / 2;

const getAdaptiveDprBounds = () => {
  const deviceDpr =
    typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const maxDpr = Math.min(deviceDpr, 1.6);
  const minDpr = Math.min(0.8, maxDpr);

  return {
    minDpr,
    maxDpr,
  };
};

const createSquareFrameGeometry = (THREE: any) =>
  new THREE.PlaneGeometry(SQUARE_OUTER_SIZE, SQUARE_OUTER_SIZE);

const createSquareOutlineTexture = (THREE: any) => {
  const textureSizePx = 512;
  const canvas = document.createElement('canvas');
  canvas.width = textureSizePx;
  canvas.height = textureSizePx;

  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }

  context.clearRect(0, 0, textureSizePx, textureSizePx);
  context.strokeStyle = '#ffffff';
  context.lineJoin = 'miter';
  context.lineCap = 'square';

  // Map the world-space border tuning value to a readable texture stroke width.
  const normalizedThickness = clamp(
    SQUARE_BORDER_THICKNESS / Math.max(SQUARE_OUTER_SIZE, 0.001),
    0.0015,
    0.02,
  );
  const strokeWidthPx = clamp(
    Math.round(textureSizePx * normalizedThickness * 2.4),
    2,
    12,
  );
  const insetPx = strokeWidthPx;
  const rectSizePx = textureSizePx - insetPx * 2;

  context.lineWidth = strokeWidthPx;
  context.strokeRect(insetPx, insetPx, rectSizePx, rectSizePx);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
};

const resolveTunnelPalette = (host: HTMLElement, THREE: any) => {
  const computedStyles = getComputedStyle(host);
  const neonColor = computedStyles.getPropertyValue('--theme-type').trim();
  const backgroundColor = computedStyles.getPropertyValue('--theme-bg').trim();
  const fallbackNeon = '#7affdc';
  const fallbackBackground = '#000000';

  return {
    neon: new THREE.Color(neonColor || fallbackNeon),
    background: new THREE.Color(backgroundColor || fallbackBackground),
  };
};

export default function NeonTunnel() {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runtimeRef = useRef<RuntimeState | null>(null);
  const hasSeenPathnameRef = useRef(false);
  const revealTriggeredRef = useRef(false);
  const introStateRef = useRef<'idle' | 'playing' | 'complete'>('idle');
  const introStartRef = useRef<number | null>(null);
  const activeSquareCountRef = useRef(SQUARE_COUNT);
  const initialThemeIntroPending = useStore(
    (state) => state.initialThemeIntroPending,
  );
  const hidePageContent = useStore((state) => state.hidePageContent);
  const revealPageContent = useStore((state) => state.revealPageContent);
  const [showEnterButton, setShowEnterButton] = useState(true);

  const syncIntroWithInitialLoadState = useCallback(() => {
    if (initialThemeIntroPending) {
      introStateRef.current = 'idle';
      introStartRef.current = null;
      revealTriggeredRef.current = false;
      setShowEnterButton(true);
      hidePageContent();
      return;
    }

    introStateRef.current = 'complete';
    introStartRef.current = null;
    revealTriggeredRef.current = true;
    setShowEnterButton(false);
  }, [hidePageContent, initialThemeIntroPending]);

  const handleEnter = useCallback(() => {
    if (introStateRef.current === 'playing') {
      return;
    }

    setShowEnterButton(false);
    introStateRef.current = 'playing';
    introStartRef.current = performance.now();
  }, []);

  useEffect(() => {
    syncIntroWithInitialLoadState();
  }, [syncIntroWithInitialLoadState]);

  useEffect(() => {
    const host = rootRef.current;
    const canvas = canvasRef.current;

    if (!host || !canvas) {
      return;
    }

    let isDisposed = false;

    const init = async () => {
      const THREE = await import('three');
      const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }] =
        await Promise.all([
          import('three/examples/jsm/postprocessing/EffectComposer.js'),
          import('three/examples/jsm/postprocessing/RenderPass.js'),
          import('three/examples/jsm/postprocessing/UnrealBloomPass.js'),
        ]);

      if (isDisposed || !rootRef.current || !canvasRef.current) {
        return;
      }

      const palette = resolveTunnelPalette(host, THREE);
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.02;
      renderer.setClearColor(palette.background, 1);

      const scene = new THREE.Scene();
      scene.background = palette.background;
      const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 260);
      scene.add(camera);

      const composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(1, 1),
        BASE_BLOOM_STRENGTH,
        0.85,
        0.08,
      );
      composer.addPass(bloomPass);

      const geometry = createSquareFrameGeometry(THREE);
      const squareOutlineTexture = createSquareOutlineTexture(THREE);
      const tunnelMaterial = new THREE.MeshBasicMaterial({
        color: palette.neon,
        transparent: true,
        opacity: 1,
        map: squareOutlineTexture,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        side: THREE.DoubleSide,
        depthWrite: false,
        alphaTest: 0.01,
      });

      const tunnelMesh = new THREE.InstancedMesh(
        geometry,
        tunnelMaterial,
        MAX_SQUARE_COUNT,
      );

      tunnelMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      scene.add(tunnelMesh);

      const dummy = new THREE.Object3D();
      const { minDpr, maxDpr } = getAdaptiveDprBounds();
      const dprController = createAdaptiveDprController({
        minDpr,
        maxDpr,
        initialDpr: maxDpr,
        step: 0.1,
        lowerFpsThreshold: 50,
        upperFpsThreshold: 58,
        minSamplesBeforeAdjust: 18,
      });

      let viewportWidth = 0;
      let viewportHeight = 0;
      const applyRendererDpr = (dpr: number) => {
        renderer.setPixelRatio(dpr);
        if (typeof composer.setPixelRatio === 'function') {
          composer.setPixelRatio(dpr);
        }
      };

      const resize = () => {
        if (!rootRef.current) {
          return;
        }

        viewportWidth = rootRef.current.clientWidth || window.innerWidth;
        viewportHeight = rootRef.current.clientHeight || window.innerHeight;
        camera.aspect = viewportWidth / Math.max(viewportHeight, 1);
        camera.updateProjectionMatrix();
        applyRendererDpr(dprController.getCurrentDpr());
        renderer.setSize(viewportWidth, viewportHeight, false);
        composer.setSize(viewportWidth, viewportHeight);
        bloomPass.setSize(viewportWidth, viewportHeight);
      };

      const updateInstanceTransforms = () => {
        const activeCount = activeSquareCountRef.current;

        tunnelMesh.count = activeCount;

        for (let index = 0; index < activeCount; index += 1) {
          const z = -index * TUNNEL_SPACING;

          dummy.position.set(0, 0, z);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.setScalar(1);
          dummy.updateMatrix();
          tunnelMesh.setMatrixAt(index, dummy.matrix);
        }

        tunnelMesh.instanceMatrix.needsUpdate = true;
      };

      const routePulseRef = { current: 0 };
      const getTunnelEndZ = () => {
        const lastSquareZ =
          -Math.max(
            0,
            (activeSquareCountRef.current - 1) * TUNNEL_SPACING,
          );
        const exitClearance = Math.max(0, TUNNEL_EXIT_CLEARANCE);

        return lastSquareZ - exitClearance;
      };

      let animationFrame = 0;
      let lastTimestamp = 0;
      const animate = (now: number) => {
        if (isDisposed) {
          return;
        }

        animationFrame = window.requestAnimationFrame(animate);

        if (lastTimestamp === 0) {
          lastTimestamp = now;
        }

        const deltaSeconds = (now - lastTimestamp) / 1000;
        lastTimestamp = now;

        const dprSample = dprController.observeFrame(now);
        if (dprSample?.nextDpr) {
          applyRendererDpr(dprSample.nextDpr);
          renderer.setSize(viewportWidth, viewportHeight, false);
          composer.setSize(viewportWidth, viewportHeight);
        }

        routePulseRef.current = Math.max(
          0,
          routePulseRef.current - deltaSeconds * 0.55,
        );

        let introProgress = 0;
        if (introStateRef.current === 'playing' && introStartRef.current !== null) {
          const rawProgress = clamp(
            (now - introStartRef.current) / TUNNEL_TRAVEL_DURATION_MS,
            0,
            1,
          );
          introProgress = easeInOutCubic(rawProgress);

          if (rawProgress >= 1) {
            introStateRef.current = 'complete';

            if (!revealTriggeredRef.current) {
              revealTriggeredRef.current = true;
              revealPageContent();
            }
          }
        } else if (introStateRef.current === 'complete') {
          introProgress = 1;
        }

        const cameraProgress = introStateRef.current === 'idle' ? 0 : introProgress;
        const baseCameraZ =
          CAMERA_START_Z + (getTunnelEndZ() - CAMERA_START_Z) * cameraProgress;
        const idleTime = now * 0.001;

        camera.position.set(0, 0, baseCameraZ);
        camera.lookAt(
          0,
          0,
          camera.position.z - 40,
        );

        bloomPass.strength = clamp(
          BASE_BLOOM_STRENGTH +
            0.025 * Math.sin(idleTime * 1.8) +
            routePulseRef.current * 0.18,
          BASE_BLOOM_STRENGTH,
          MAX_BLOOM_STRENGTH,
        );
        bloomPass.radius = 0.42 + routePulseRef.current * 0.06;
        updateInstanceTransforms();
        composer.render();
      };

      const triggerPulse = () => {
        routePulseRef.current = 1;
      };

      resize();
      animationFrame = window.requestAnimationFrame(animate);
      window.addEventListener('resize', resize, { passive: true });

      const observer = new MutationObserver(() => {
        const nextPalette = resolveTunnelPalette(host, THREE);
        renderer.setClearColor(nextPalette.background, 1);
        scene.background = nextPalette.background;
        tunnelMaterial.color.copy(nextPalette.neon);
      });
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });

      runtimeRef.current = {
        THREE,
        renderer,
        composer,
        bloomPass,
        camera,
        scene,
        tunnelMesh,
        routePulseRef,
        animationFrame,
        resize,
        triggerPulse,
        dispose: () => {
          window.removeEventListener('resize', resize);
          observer.disconnect();
          window.cancelAnimationFrame(animationFrame);
          tunnelMesh.geometry.dispose();
          squareOutlineTexture?.dispose();
          tunnelMaterial.dispose();
          if (typeof composer.dispose === 'function') {
            composer.dispose();
          }
          renderer.dispose();
        },
      };
    };

    init();

    return () => {
      isDisposed = true;
      runtimeRef.current?.dispose();
      runtimeRef.current = null;
    };
  }, [revealPageContent]);

  useEffect(() => {
    if (!hasSeenPathnameRef.current) {
      hasSeenPathnameRef.current = true;
      return;
    }

    if (introStateRef.current === 'complete') {
      runtimeRef.current?.triggerPulse();
    }
  }, [pathname]);

  return (
    <>
      <div ref={rootRef} className={styles.root} aria-hidden="true">
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>

      <div className={styles.overlay}>
        {showEnterButton && <IntroEnterButton onClick={handleEnter} />}
      </div>
    </>
  );
}
