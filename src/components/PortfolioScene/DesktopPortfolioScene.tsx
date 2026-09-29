'use client';

/* eslint-disable react-hooks/immutability -- Three.js cameras are intentionally
   mutated inside R3F's frame loop; React does not own these imperative objects. */

import { Edges, Html } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  AppRouterContext,
  GlobalLayoutRouterContext,
  LayoutRouterContext,
} from 'next/dist/shared/lib/app-router-context.shared-runtime';
import {
  NavigationPromisesContext,
  PathnameContext,
  PathParamsContext,
  SearchParamsContext,
} from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
import type { ReactNode } from 'react';
import {
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  MathUtils,
  OrthographicCamera,
  Vector3,
} from 'three';
import { useShallow } from 'zustand/react/shallow';
import { useStore, type CameraTrack } from '@/store/store';

interface DesktopPortfolioSceneProps {
  children: ReactNode;
  footer: ReactNode;
  header: ReactNode;
  routeKey: string;
}

type NextRouterContexts = {
  appRouter: React.ContextType<typeof AppRouterContext>;
  globalLayoutRouter: React.ContextType<typeof GlobalLayoutRouterContext>;
  layoutRouter: React.ContextType<typeof LayoutRouterContext>;
  navigationPromises: React.ContextType<typeof NavigationPromisesContext>;
  pathParams: React.ContextType<typeof PathParamsContext>;
  pathname: React.ContextType<typeof PathnameContext>;
  searchParams: React.ContextType<typeof SearchParamsContext>;
};

type BlockLayout = {
  depth: number;
  height: number;
  id: string;
  kind: 'default' | 'footer' | 'head';
  width: number;
  x: number;
  y: number;
};

type SceneLayout = {
  blocks: BlockLayout[];
  height: number;
  width: number;
};

type SceneColors = {
  background: string;
  edge: string;
  edgeWidth: number;
  footer: string;
  head: string;
  side: string;
};

const EMPTY_LAYOUT: SceneLayout = { blocks: [], height: 0, width: 0 };
const FALLBACK_COLORS: SceneColors = {
  background: '#d3d1ca',
  edge: '#050200',
  edgeWidth: 2,
  footer: '#dbdad4',
  head: '#dbdad4',
  side: '#d8d6cf',
};

const getSceneColors = (): SceneColors => {
  const styles = getComputedStyle(document.body);
  const read = (property: string, fallback: string) =>
    styles.getPropertyValue(property).trim() || fallback;

  const side = read('--theme-blok-sidepanel', FALLBACK_COLORS.side);
  const opaqueSurface = (property: string, fallback: string) => {
    const value = read(property, fallback);
    return value === 'transparent' ? side : value;
  };

  return {
    background: read('--theme-bg', FALLBACK_COLORS.background),
    // Read the resolved CSS `currentColor`, which is the exact color used by
    // the native `.blok` borders, instead of handing Three a CSS variable.
    edge: styles.color || FALLBACK_COLORS.edge,
    edgeWidth:
      Number.parseFloat(read('--border-width', `${FALLBACK_COLORS.edgeWidth}px`)) ||
      FALLBACK_COLORS.edgeWidth,
    footer: opaqueSurface('--theme-blok-sidepanel-footer', FALLBACK_COLORS.footer),
    head: opaqueSurface('--theme-blok-sidepanel-head', FALLBACK_COLORS.head),
    side,
  };
};

const getBlockKind = (element: HTMLElement): BlockLayout['kind'] => {
  if (element.classList.contains('blok-Head')) return 'head';
  if (element.classList.contains('blok-Footer')) return 'footer';
  return 'default';
};

const getLayoutOffset = (element: HTMLElement, root: HTMLElement) => {
  let x = 0;
  let y = 0;
  let current: HTMLElement | null = element;

  // offset* values stay in CSS layout space. getBoundingClientRect() cannot be
  // used here because Drei has already projected the HTML through the camera.
  while (current && current !== root) {
    x += current.offsetLeft;
    y += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }

  return { x, y };
};

function CameraRig({ layout }: { layout: SceneLayout }) {
  const cameraTrack = useStore((state) => state.cameraTrack);
  const { camera, size } = useThree();
  const lookAt = useRef(new Vector3());
  const desiredLookAt = useMemo(() => new Vector3(), []);
  const desiredPosition = useMemo(() => new Vector3(), []);

  useFrame((_, delta) => {
    const orthographicCamera = camera as OrthographicCamera;
    const viewportWidth = Math.max(1, size.width);
    const viewportHeight = Math.max(1, size.height);
    const sceneHeight = Math.max(viewportHeight, layout.height);
    const maxScroll = Math.max(0, sceneHeight - viewportHeight);
    const scrollY = MathUtils.clamp(window.scrollY, 0, maxScroll);
    const focusY = sceneHeight / 2 - viewportHeight / 2 - scrollY;

    let zoom = 1;
    desiredLookAt.set(0, focusY, 0);
    desiredPosition.set(0, focusY, Math.max(2400, viewportWidth * 2.25));

    if (cameraTrack === 'STRUCTURE') {
      zoom = 0.72;
      desiredPosition.set(
        viewportWidth * 0.14,
        focusY + viewportWidth * 0.16,
        viewportWidth * 2,
      );
      desiredLookAt.set(0, focusY, -viewportWidth * 0.2);
    } else if (cameraTrack === 'ANGLED') {
      zoom = MathUtils.clamp(
        (viewportHeight / (sceneHeight + viewportWidth * 0.75)) * 0.88,
        0.12,
        0.46,
      );
      desiredPosition.set(
        viewportWidth * 0.92,
        viewportWidth * 0.86,
        viewportWidth * 1.55,
      );
      desiredLookAt.set(0, 0, -viewportWidth * 0.38);
    }

    const damping = cameraTrack === 'FULLSCREEN' ? 10 : 6.5;
    orthographicCamera.position.x = MathUtils.damp(
      orthographicCamera.position.x,
      desiredPosition.x,
      damping,
      delta,
    );
    orthographicCamera.position.y = MathUtils.damp(
      orthographicCamera.position.y,
      desiredPosition.y,
      damping,
      delta,
    );
    orthographicCamera.position.z = MathUtils.damp(
      orthographicCamera.position.z,
      desiredPosition.z,
      damping,
      delta,
    );
    lookAt.current.lerp(desiredLookAt, 1 - Math.exp(-damping * delta));
    orthographicCamera.zoom = MathUtils.damp(
      orthographicCamera.zoom,
      zoom,
      damping,
      delta,
    );
    orthographicCamera.lookAt(lookAt.current);
    orthographicCamera.updateProjectionMatrix();
  });

  return null;
}

function StructureBlock({
  block,
  colors,
}: {
  block: BlockLayout;
  colors: SceneColors;
}) {
  const color =
    block.kind === 'head'
      ? colors.head
      : block.kind === 'footer'
        ? colors.footer
        : colors.side;

  return (
    <mesh position={[block.x, block.y, -block.depth / 2]}>
      <boxGeometry args={[block.width, block.height, block.depth]} />
      <meshBasicMaterial color={color} />
      <Edges
        color={colors.edge}
        lineWidth={colors.edgeWidth}
        renderOrder={2}
        scale={1.0015}
        threshold={15}
      />
    </mesh>
  );
}

function SceneDocument({
  children,
  colors,
  footer,
  header,
  nextRouterContexts,
  onLayout,
  routeKey,
}: DesktopPortfolioSceneProps & {
  colors: SceneColors;
  nextRouterContexts: NextRouterContexts;
  onLayout: (layout: SceneLayout) => void;
}) {
  const { size } = useThree();
  const documentRef = useRef<HTMLDivElement | null>(null);
  const [layout, setLayout] = useState<SceneLayout>(EMPTY_LAYOUT);

  const measure = useCallback(() => {
    const documentElement = documentRef.current;
    if (!documentElement) return;

    const documentWidth = documentElement.offsetWidth;
    const documentHeight = Math.max(
      documentElement.offsetHeight,
      documentElement.scrollHeight,
    );
    const blockElements = Array.from(
      documentElement.querySelectorAll<HTMLElement>('.blok'),
    );
    const blocks = blockElements.flatMap((element, index) => {
      const computed = getComputedStyle(element);
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      if (
        computed.display === 'contents' ||
        width < 1 ||
        height < 1
      ) {
        return [];
      }

      const { x: left, y: top } = getLayoutOffset(element, documentElement);

      return [{
        depth: width,
        height,
        id: `${element.className}-${index}`,
        kind: getBlockKind(element),
        width,
        x: left + width / 2 - documentWidth / 2,
        y: documentHeight / 2 - top - height / 2,
      } satisfies BlockLayout];
    });
    const nextLayout = {
      blocks,
      height: documentHeight,
      width: documentWidth,
    };

    setLayout(nextLayout);
    onLayout(nextLayout);
  }, [onLayout]);

  useLayoutEffect(() => {
    const documentElement = documentRef.current;
    if (!documentElement) return;

    let frame = window.requestAnimationFrame(measure);
    const scheduleMeasure = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
    };
    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(documentElement);
    documentElement
      .querySelectorAll<HTMLElement>('.blok')
      .forEach((block) => resizeObserver.observe(block));
    const mutationObserver = new MutationObserver(scheduleMeasure);
    mutationObserver.observe(documentElement, {
      childList: true,
      subtree: true,
    });
    document.fonts?.ready.then(scheduleMeasure).catch(() => {});

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [measure, routeKey, size.width]);

  return (
    <>
      <CameraRig layout={layout} />
      <group name="site-structure">
        {layout.blocks.map((block) => (
          <StructureBlock block={block} colors={colors} key={block.id} />
        ))}
      </group>
      <group name="environment" />
      <Html
        center
        distanceFactor={400}
        position={[0, 0, 1]}
        transform
        zIndexRange={[20, 0]}
      >
        <AppRouterContext.Provider value={nextRouterContexts.appRouter}>
          <GlobalLayoutRouterContext.Provider
            value={nextRouterContexts.globalLayoutRouter}
          >
            <LayoutRouterContext.Provider value={nextRouterContexts.layoutRouter}>
              <SearchParamsContext.Provider value={nextRouterContexts.searchParams}>
                <PathnameContext.Provider value={nextRouterContexts.pathname}>
                  <PathParamsContext.Provider value={nextRouterContexts.pathParams}>
                    <NavigationPromisesContext.Provider
                      value={nextRouterContexts.navigationPromises}
                    >
                      <div
                        className="portfolioScene_Document"
                        ref={documentRef}
                        style={{ width: `${size.width}px` }}
                      >
                        <main className="main portfolioScene_Main">
                          {header}
                          {children}
                          {footer}
                        </main>
                      </div>
                    </NavigationPromisesContext.Provider>
                  </PathParamsContext.Provider>
                </PathnameContext.Provider>
              </SearchParamsContext.Provider>
            </LayoutRouterContext.Provider>
          </GlobalLayoutRouterContext.Provider>
        </AppRouterContext.Provider>
      </Html>
    </>
  );
}

function CameraTrackHud() {
  const { cameraTrack, setCameraTrack } = useStore(
    useShallow((state) => ({
      cameraTrack: state.cameraTrack,
      setCameraTrack: state.setCameraTrack,
    })),
  );
  const tracks: Array<{ label: string; value: CameraTrack }> = [
    { label: 'Fullscreen', value: 'FULLSCREEN' },
    { label: '3D', value: 'STRUCTURE' },
    { label: 'Angled', value: 'ANGLED' },
  ];

  return (
    <nav className="portfolioScene_Hud" aria-label="Camera position">
      {tracks.map((track) => (
        <button
          aria-pressed={cameraTrack === track.value}
          className="portfolioScene_Button"
          data-active={cameraTrack === track.value}
          key={track.value}
          onClick={() => setCameraTrack(track.value)}
          type="button"
        >
          {track.label}
        </button>
      ))}
    </nav>
  );
}

export default function DesktopPortfolioScene({
  children,
  footer,
  header,
  routeKey,
}: DesktopPortfolioSceneProps) {
  const theme = useStore((state) => state.theme);
  const [layout, setLayout] = useState<SceneLayout>(EMPTY_LAYOUT);
  const [colors, setColors] = useState<SceneColors>(FALLBACK_COLORS);
  const nextRouterContexts: NextRouterContexts = {
    appRouter: useContext(AppRouterContext),
    globalLayoutRouter: useContext(GlobalLayoutRouterContext),
    layoutRouter: useContext(LayoutRouterContext),
    navigationPromises: useContext(NavigationPromisesContext),
    pathParams: useContext(PathParamsContext),
    pathname: useContext(PathnameContext),
    searchParams: useContext(SearchParamsContext),
  };

  useLayoutEffect(() => {
    setColors(getSceneColors());
  }, [theme]);

  return (
    <div className="portfolioScene" data-portfolio-scene="true">
      <div className="portfolioScene_Canvas">
        <Canvas
          camera={{
            far: 50000,
            near: -50000,
            position: [0, 0, 3000],
            zoom: 0.72,
          }}
          dpr={[1, 1.5]}
          flat
          gl={{ alpha: true, antialias: true }}
          orthographic
        >
          {/* React 19 can defer the streamed RSC subtree on Drei's first DOM
              portal. Mounting the tiny portal root first makes the real HTML
              front commit deterministically without duplicating its content. */}
          <Html>
            <span className="portfolioScene_PortalBootstrap" aria-hidden="true" />
          </Html>
          <SceneDocument
            colors={colors}
            footer={footer}
            header={header}
            nextRouterContexts={nextRouterContexts}
            onLayout={setLayout}
            routeKey={routeKey}
          >
            {children}
          </SceneDocument>
        </Canvas>
      </div>
      <div
        aria-hidden="true"
        className="portfolioScene_ScrollExtent"
        style={{ height: `${Math.max(layout.height, 1)}px` }}
      />
      <CameraTrackHud />
    </div>
  );
}
