'use client';

import { useEffect, useRef, useState } from 'react';
import GrainyGradient from '@/components/GrainyGradient';
import { useStore, type Theme } from '@/store/store';
import styles from './DitheringVideoPortrait.module.sass';

type ThemeColorPair = {
  foreground: string;
  background: string;
};

type ThemeColorMap = Partial<Record<Theme, ThemeColorPair>>;

type ResolvedThemeConfig = {
  foregroundColor: string;
  backgroundColor: string | null;
  threshold: number;
};

export interface DitheringVideoPortraitProps {
  src: string;
  posterSrc?: string;
  alt?: string;
  variant?: 'blok' | 'panel';
  showControls?: boolean;
  mode?: 'cross' | 'pixel';
  pixelSize?: number;
  contrast?: number;
  threshold?: number;
  blackness?: number;
  invert?: boolean;
  maxFps?: number;
  crossWeight?: number;
  crossInset?: number;
  themeColors?: ThemeColorMap;
}

type RenderSettings = {
  mode: 'cross' | 'pixel';
  pixelSize: number;
  contrast: number;
  threshold?: number;
  blackness?: number;
  invert?: boolean;
  maxFps: number;
  crossWeight: number;
  crossInset: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const parseNumber = (value: string): number | undefined => {
  const parsed = Number.parseFloat(value.trim());
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseBoolean = (value: string): boolean | undefined => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized === '1' || normalized === 'true' || normalized === 'yes') {
    return true;
  }
  if (normalized === '0' || normalized === 'false' || normalized === 'no') {
    return false;
  }
  return undefined;
};

const isCanvasColorValue = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  return (
    !normalized.startsWith('var(') &&
    !normalized.includes('gradient(') &&
    !normalized.includes('url(') &&
    !normalized.includes('image(')
  );
};

const resolveCanvasColor = (
  value: string | undefined,
  bodyStyles: CSSStyleDeclaration,
  fallback: string | null = null,
): string | null => {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  const cssVarWithFallbackMatch = trimmed.match(
    /^var\(\s*(--[^,\s)]+)\s*,\s*([^)]+)\s*\)$/,
  );
  if (cssVarWithFallbackMatch) {
    const [, varName, fallbackValue] = cssVarWithFallbackMatch;
    const resolved = bodyStyles.getPropertyValue(varName).trim();
    return resolveCanvasColor(resolved || fallbackValue, bodyStyles, fallback);
  }

  const cssVarMatch = trimmed.match(/^var\(\s*(--[^,\s)]+)\s*\)$/);
  if (cssVarMatch) {
    const [, varName] = cssVarMatch;
    const resolved = bodyStyles.getPropertyValue(varName).trim();
    return resolveCanvasColor(resolved, bodyStyles, fallback);
  }

  if (!isCanvasColorValue(trimmed)) return fallback;
  return trimmed;
};

// Inspired by https://editor.p5js.org/brain/sketches/hU0ANATF- and https://editor.p5js.org/codingtrain/sketches/-YkMaf9Ea
const DitheringVideoPortrait = ({
  src,
  posterSrc,
  alt = 'Dithered video portrait',
  variant = 'blok',
  showControls = true,
  mode = 'cross',
  pixelSize = 5.2,
  contrast = 1.1,
  threshold,
  blackness,
  invert,
  maxFps = 18,
  crossWeight = 0.18,
  crossInset = 0.2,
  themeColors,
}: DitheringVideoPortraitProps) => {
  const theme = useStore((state) => state.theme);
  const cycleTheme = useStore((state) => state.cycleTheme);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameSizeRef = useRef({ width: 0, height: 0 });
  const themeRef = useRef(theme);
  const themeColorsRef = useRef<ThemeColorMap | undefined>(themeColors);
  const resolvedThemeConfigRef = useRef<ResolvedThemeConfig>({
    foregroundColor: '#ffffff',
    backgroundColor: '#b49f82',
    threshold: 138,
  });
  const [currentMode, setCurrentMode] = useState<'cross' | 'pixel'>(mode);
  const [currentThreshold, setCurrentThreshold] = useState<number>(
    Math.round(clamp(threshold ?? 138, 0, 255)),
  );
  const [currentPixelSize, setCurrentPixelSize] = useState<number>(
    Math.round(clamp(pixelSize, 2, 8)),
  );
  const [currentContrast, setCurrentContrast] = useState<number>(
    Math.round(clamp(contrast, 0, 2) * 10) / 10,
  );
  const [currentInvert, setCurrentInvert] = useState<boolean | undefined>(invert);
  const [isDocumentVisible, setIsDocumentVisible] = useState<boolean>(
    typeof document === 'undefined' ? true : !document.hidden,
  );
  const renderSettingsRef = useRef<RenderSettings>({
    mode: currentMode,
    pixelSize: currentPixelSize,
    contrast: currentContrast,
    threshold: currentThreshold,
    blackness,
    invert: currentInvert,
    maxFps,
    crossWeight,
    crossInset,
  });
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [didFail, setDidFail] = useState(false);

  frameSizeRef.current = frameSize;
  renderSettingsRef.current = {
    mode: currentMode,
    pixelSize: currentPixelSize,
    contrast: currentContrast,
    threshold: currentThreshold,
    blackness,
    invert: currentInvert,
    maxFps,
    crossWeight,
    crossInset,
  };
  themeRef.current = theme;
  themeColorsRef.current = themeColors;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setFrameSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  useEffect(() => {
    if (typeof threshold === 'number') {
      setCurrentThreshold(Math.round(clamp(threshold, 0, 255)));
    }
  }, [threshold]);

  useEffect(() => {
    setCurrentPixelSize(Math.round(clamp(pixelSize, 2, 8)));
  }, [pixelSize]);

  useEffect(() => {
    setCurrentContrast(Math.round(clamp(contrast, 0, 2) * 10) / 10);
  }, [contrast]);

  useEffect(() => {
    setCurrentInvert(invert);
  }, [invert]);

  useEffect(() => {
    const onVisibilityChange = () => {
      setIsDocumentVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const bodyStyles = window.getComputedStyle(document.body);
    const themeType =
      bodyStyles.getPropertyValue('--theme-type').trim() || '#ffffff';
    const themeBg = bodyStyles.getPropertyValue('--theme-bg').trim() || '#000';
    const themeTypeContrast =
      bodyStyles.getPropertyValue('--theme-type-contrast').trim() || '#000';
    const currentTheme = themeRef.current;
    const themeColorOverrides = themeColorsRef.current?.[currentTheme];
    const baseForeground = themeColorOverrides?.foreground ?? themeType;
    const baseBackground = themeColorOverrides?.background ?? themeBg;
    const cssBlackness = parseNumber(
      bodyStyles.getPropertyValue('--portrait-dither-blackness'),
    );
    const cssThreshold = parseNumber(
      bodyStyles.getPropertyValue('--portrait-dither-threshold'),
    );
    const cssInvert = parseBoolean(
      bodyStyles.getPropertyValue('--portrait-dither-invert'),
    );

    const settings = renderSettingsRef.current;
    const resolvedInvert = settings.invert ?? cssInvert ?? false;
    const rawForeground = resolvedInvert ? baseBackground : baseForeground;
    const rawBackground = resolvedInvert ? baseForeground : baseBackground;
    const resolvedForeground =
      resolveCanvasColor(rawForeground, bodyStyles, themeTypeContrast) ||
      themeTypeContrast;
    const resolvedBackground = resolveCanvasColor(rawBackground, bodyStyles);
    const resolvedThreshold = Math.round(
      clamp(
        settings.threshold ??
          cssThreshold ??
          (settings.blackness ?? cssBlackness ?? 0.54) * 255,
        0,
        255,
      ),
    );

    resolvedThemeConfigRef.current = {
      foregroundColor: resolvedForeground,
      backgroundColor: resolvedBackground,
      threshold: resolvedThreshold,
    };
  }, [theme, themeColors, currentInvert, currentThreshold, blackness]);

  useEffect(() => {
    const video = videoRef.current;
    const outputCanvas = outputCanvasRef.current;
    if (!video || !outputCanvas) return;
    if (!isDocumentVisible) return;

    let disposed = false;
    let rafId: number | null = null;
    let videoFrameCallbackId: number | null = null;
    let failTimer: number | null = null;
    let didRenderAtLeastOneFrame = false;
    let lastFrameAt = 0;

    setIsLoading(true);
    setDidFail(false);

    const sourceCanvas =
      sourceCanvasRef.current || document.createElement('canvas');
    sourceCanvasRef.current = sourceCanvas;

    const renderFrame = (now: number) => {
      if (disposed) return;

      const size = frameSizeRef.current;
      const settings = renderSettingsRef.current;
      const fps = clamp(settings.maxFps, 8, 30);
      const frameInterval = 1000 / fps;

      if (now - lastFrameAt < frameInterval) {
        rafId = window.requestAnimationFrame(renderFrame);
        return;
      }
      lastFrameAt = now;

      if (
        !size.width ||
        !size.height ||
        video.readyState < 2 ||
        !video.videoWidth ||
        !video.videoHeight
      ) {
        rafId = window.requestAnimationFrame(renderFrame);
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const outputWidth = Math.max(1, Math.floor(size.width * dpr));
      const outputHeight = Math.max(1, Math.floor(size.height * dpr));

      if (
        outputCanvas.width !== outputWidth ||
        outputCanvas.height !== outputHeight
      ) {
        outputCanvas.width = outputWidth;
        outputCanvas.height = outputHeight;
      }

      const outputCtx = outputCanvas.getContext('2d');
      if (!outputCtx) {
        setDidFail(true);
        setIsLoading(false);
        return;
      }

      const targetCellSize = clamp(settings.pixelSize, 2, 18);
      const sampleWidth = clamp(
        Math.round(size.width / targetCellSize),
        96,
        420,
      );
      const sampleHeight = clamp(
        Math.round(size.height / targetCellSize),
        54,
        280,
      );

      if (
        sourceCanvas.width !== sampleWidth ||
        sourceCanvas.height !== sampleHeight
      ) {
        sourceCanvas.width = sampleWidth;
        sourceCanvas.height = sampleHeight;
      }

      const sourceCtx = sourceCanvas.getContext('2d', {
        willReadFrequently: true,
      });
      if (!sourceCtx) {
        setDidFail(true);
        setIsLoading(false);
        return;
      }

      sourceCtx.imageSmoothingEnabled = false;
      sourceCtx.drawImage(video, 0, 0, sampleWidth, sampleHeight);

      const frameData = sourceCtx.getImageData(
        0,
        0,
        sampleWidth,
        sampleHeight,
      ).data;
      const monochrome = new Float32Array(sampleWidth * sampleHeight);
      const contrastStrength = clamp(settings.contrast, 0, 2);
      const themeConfig = resolvedThemeConfigRef.current;
      const threshold = themeConfig.threshold;

      for (let i = 0; i < monochrome.length; i += 1) {
        const idx = i * 4;
        const r = frameData[idx];
        const g = frameData[idx + 1];
        const b = frameData[idx + 2];

        let luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        luma = (luma - 128) * contrastStrength + 128;
        monochrome[i] = clamp(luma, 0, 255);
      }

      const activeBits = new Uint8Array(sampleWidth * sampleHeight);

      for (let y = 0; y < sampleHeight; y += 1) {
        for (let x = 0; x < sampleWidth; x += 1) {
          const index = x + y * sampleWidth;
          const oldPixel = clamp(monochrome[index], 0, 255);
          const newPixel = oldPixel < threshold ? 0 : 255;
          const error = oldPixel - newPixel;

          activeBits[index] = newPixel === 0 ? 1 : 0;
          monochrome[index] = newPixel;

          if (x + 1 < sampleWidth) {
            monochrome[index + 1] += error * (7 / 16);
          }
          if (x > 0 && y + 1 < sampleHeight) {
            monochrome[index + sampleWidth - 1] += error * (3 / 16);
          }
          if (y + 1 < sampleHeight) {
            monochrome[index + sampleWidth] += error * (5 / 16);
          }
          if (x + 1 < sampleWidth && y + 1 < sampleHeight) {
            monochrome[index + sampleWidth + 1] += error * (1 / 16);
          }
        }
      }

      outputCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      outputCtx.clearRect(0, 0, size.width, size.height);
      if (themeConfig.backgroundColor) {
        outputCtx.fillStyle = themeConfig.backgroundColor;
        outputCtx.fillRect(0, 0, size.width, size.height);
      }
      outputCtx.strokeStyle = themeConfig.foregroundColor;
      outputCtx.fillStyle = themeConfig.foregroundColor;

      const cellW = size.width / sampleWidth;
      const cellH = size.height / sampleHeight;

      if (settings.mode === 'pixel') {
        for (let y = 0; y < sampleHeight; y += 1) {
          for (let x = 0; x < sampleWidth; x += 1) {
            if (!activeBits[x + y * sampleWidth]) continue;
            outputCtx.fillRect(x * cellW, y * cellH, cellW, cellH);
          }
        }
      } else {
        const crossLineWidth = Math.max(
          0.6,
          Math.min(cellW, cellH) * clamp(settings.crossWeight, 0.08, 0.5),
        );
        const crossPadding = Math.max(
          0.02,
          Math.min(cellW, cellH) * clamp(settings.crossInset, 0, 0.45),
        );

        outputCtx.beginPath();
        outputCtx.lineWidth = crossLineWidth;
        outputCtx.lineCap = 'square';

        for (let y = 0; y < sampleHeight; y += 1) {
          for (let x = 0; x < sampleWidth; x += 1) {
            if (!activeBits[x + y * sampleWidth]) continue;

            const left = x * cellW;
            const top = y * cellH;
            const right = left + cellW;
            const bottom = top + cellH;

            outputCtx.moveTo(left + crossPadding, top + crossPadding);
            outputCtx.lineTo(right - crossPadding, bottom - crossPadding);
            outputCtx.moveTo(right - crossPadding, top + crossPadding);
            outputCtx.lineTo(left + crossPadding, bottom - crossPadding);
          }
        }

        outputCtx.stroke();
      }

      if (!didRenderAtLeastOneFrame) {
        didRenderAtLeastOneFrame = true;
        setIsLoading(false);
        if (failTimer !== null) {
          window.clearTimeout(failTimer);
          failTimer = null;
        }
      }
    };

    const scheduleNextFrame = () => {
      if (disposed) return;

      if (typeof video.requestVideoFrameCallback === 'function') {
        videoFrameCallbackId = video.requestVideoFrameCallback((time) => {
          renderFrame(time);
          scheduleNextFrame();
        });
        return;
      }

      rafId = window.requestAnimationFrame((time) => {
        renderFrame(time);
        scheduleNextFrame();
      });
    };

    const start = () => {
      if (disposed) return;
      video
        .play()
        .then(() => {
          if (!disposed) {
            scheduleNextFrame();
          }
        })
        .catch(() => {
          if (!disposed) {
            setDidFail(true);
            setIsLoading(false);
          }
        });
    };

    const onError = () => {
      if (disposed) return;
      setDidFail(true);
      setIsLoading(false);
    };

    failTimer = window.setTimeout(() => {
      if (disposed || didRenderAtLeastOneFrame || document.hidden) return;
      setDidFail(true);
      setIsLoading(false);
    }, 7000);

    video.addEventListener('error', onError);
    video.load();
    start();

    return () => {
      disposed = true;
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (
        videoFrameCallbackId !== null &&
        typeof video.cancelVideoFrameCallback === 'function'
      ) {
        video.cancelVideoFrameCallback(videoFrameCallbackId);
      }
      if (failTimer !== null) window.clearTimeout(failTimer);
      video.pause();
      video.removeEventListener('error', onError);
    };
  }, [src, isDocumentVisible]);

  const cycleMode = () => {
    setCurrentMode((prev) => (prev === 'cross' ? 'pixel' : 'cross'));
  };

  const cycleThreshold = () => {
    setCurrentThreshold((prev) => (prev + 50 > 255 ? 0 : prev + 50));
  };

  const cyclePixelSize = () => {
    setCurrentPixelSize((prev) => (prev >= 8 ? 2 : prev + 1));
  };

  const cycleContrast = () => {
    setCurrentContrast((prev) => {
      const next = Math.round((prev + 0.2) * 10) / 10;
      return next > 2 ? 0 : next;
    });
  };

  const toggleInvert = () => {
    setCurrentInvert((prev) => !Boolean(prev));
  };

  const frameClassName =
    variant === 'panel' ? styles.panelFrame : `${styles.frame} imageItem`;
  const isPosterVisible = Boolean(posterSrc) && (isLoading || didFail);

  const frameNode = (
    <div ref={containerRef} className={frameClassName}>
      {posterSrc ? (
        <img
          src={posterSrc}
          alt=""
          aria-hidden="true"
          className={styles.posterImage}
          fetchPriority="high"
          style={{ opacity: isPosterVisible ? 1 : 0 }}
        />
      ) : null}

      <video
        ref={videoRef}
        className={styles.hiddenVideo}
        src={src}
        poster={posterSrc}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      />

      <canvas
        ref={outputCanvasRef}
        className={styles.canvas}
        role="img"
        aria-label={alt}
        aria-hidden={isLoading || didFail}
        style={{ opacity: !isLoading && !didFail ? 1 : 0 }}
      />

      {showControls && (
        <div className={styles.controls}>
          <button type="button" onClick={cycleMode}>
            Mode: {currentMode}
          </button>
          <button type="button" onClick={cycleThreshold}>
            Threshold: {currentThreshold}
          </button>
          <button type="button" onClick={cyclePixelSize}>
            Pixel size: {currentPixelSize}
          </button>
          <button type="button" onClick={cycleContrast}>
            Contrast: {currentContrast.toFixed(1)}
          </button>
          <button type="button" onClick={toggleInvert}>
            Invert: {currentInvert ? 'on' : 'off'}
          </button>
          <button type="button" onClick={cycleTheme}>
            Theme: {theme}
          </button>
        </div>
      )}
    </div>
  );

  if (variant === 'panel') {
    return frameNode;
  }

  return (
    <div className="blok blok-Portrait blok-Animate">
      <GrainyGradient variant="blok" />
      <div className="row">
        <div className="column column-Image" style={{ padding: 0 }}>
          {frameNode}
        </div>
      </div>
    </div>
  );
};

export default DitheringVideoPortrait;
