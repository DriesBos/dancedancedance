'use client';

import { useEffect, useRef, useState } from 'react';
import GrainyGradient from '@/components/GrainyGradient';
import styles from './AsciiPortrait.module.sass';

const DEFAULT_CHARSET =
  "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft?+~i!lI;:,^`'.";
const BASE_COLUMNS = 220;
const CHAR_ASPECT_RATIO = 0.56;

interface AsciiVideoPortraitProps {
  src: string;
  alt?: string;
  density?: number;
  contrast?: number;
  invert?: boolean;
  charset?: string;
  maxFps?: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const mapRange = (
  value: number,
  minIn: number,
  maxIn: number,
  minOut: number,
  maxOut: number,
) => {
  if (maxIn === minIn) return minOut;
  const normalized = (value - minIn) / (maxIn - minIn);
  return minOut + (maxOut - minOut) * normalized;
};

const AsciiVideoPortrait = ({
  src,
  alt = 'ASCII video portrait',
  density = 1,
  contrast = 1.25,
  invert = false,
  charset = DEFAULT_CHARSET,
  maxFps = 16,
}: AsciiVideoPortraitProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerWidthRef = useRef(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [asciiOutput, setAsciiOutput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [didFail, setDidFail] = useState(false);

  containerWidthRef.current = containerWidth;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setContainerWidth(entry.contentRect.width);
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setDidFail(false);
    setAsciiOutput('');

    let disposed = false;
    let rafId: number | null = null;
    let lastFrameAt = 0;
    let hadFrame = false;

    const fps = clamp(maxFps, 4, 30);
    const frameIntervalMs = 1000 / fps;
    const resolvedCharset =
      (charset && charset.length > 1 ? charset : DEFAULT_CHARSET).trimEnd() + ' ';
    const charsetMaxIndex = resolvedCharset.length - 1;
    const safeContrast = clamp(contrast, 0.6, 2.8);
    const safeDensity = clamp(density, 0.5, 2.4);

    const renderFrame = (now: number) => {
      if (disposed) return;

      if (now - lastFrameAt < frameIntervalMs) {
        rafId = window.requestAnimationFrame(renderFrame);
        return;
      }
      lastFrameAt = now;

      const width = containerWidthRef.current;
      const sourceWidth = video.videoWidth;
      const sourceHeight = video.videoHeight;

      if (!width || !sourceWidth || !sourceHeight) {
        rafId = window.requestAnimationFrame(renderFrame);
        return;
      }

      const sampleCols = clamp(
        Math.round(BASE_COLUMNS * safeDensity),
        120,
        360,
      );
      const sampleRows = clamp(
        Math.round((sampleCols * sourceHeight) / sourceWidth * CHAR_ASPECT_RATIO),
        54,
        220,
      );

      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }
      const canvas = canvasRef.current;
      if (canvas.width !== sampleCols || canvas.height !== sampleRows) {
        canvas.width = sampleCols;
        canvas.height = sampleRows;
      }

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        setDidFail(true);
        setIsLoading(false);
        return;
      }

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(video, 0, 0, sampleCols, sampleRows);
      const pixels = ctx.getImageData(0, 0, sampleCols, sampleRows).data;

      let out = '';
      for (let y = 0; y < sampleRows; y += 1) {
        for (let x = 0; x < sampleCols; x += 1) {
          const idx = (x + y * sampleCols) * 4;
          const r = pixels[idx];
          const g = pixels[idx + 1];
          const b = pixels[idx + 2];

          let luminance = Math.floor((r + g + b) / 3);
          luminance = (luminance - 128) * safeContrast + 128;
          luminance = clamp(luminance, 0, 255);
          if (invert) luminance = 255 - luminance;

          const charIndex = clamp(
            Math.round(mapRange(luminance, 255, 0, 0, charsetMaxIndex)),
            0,
            charsetMaxIndex,
          );
          const char = resolvedCharset.charAt(charIndex) || ' ';
          out += char === ' ' ? '\u00A0' : char;
        }
        out += '\n';
      }

      setAsciiOutput(out);
      if (!hadFrame) {
        hadFrame = true;
        setIsLoading(false);
      }

      rafId = window.requestAnimationFrame(renderFrame);
    };

    const start = () => {
      if (disposed) return;
      video
        .play()
        .then(() => {
          if (!disposed) rafId = window.requestAnimationFrame(renderFrame);
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

    video.addEventListener('error', onError);
    video.load();

    start();

    return () => {
      disposed = true;
      video.pause();
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      video.removeEventListener('error', onError);
    };
  }, [src, density, contrast, invert, charset, maxFps]);

  return (
    <div
      className="blok blok-Portrait blok-Animate"
      style={{ background: 'var(--theme-blok)' }}
    >
      <GrainyGradient variant="blok" />
      <div className="row" style={{ background: 'var(--theme-blok)' }}>
        <div
          className="column column-Image"
          style={{ padding: 0, background: 'var(--theme-blok)' }}
        >
          <div
            ref={containerRef}
            className={`${styles.frame} imageItem`}
            style={{
              background: 'var(--theme-blok)',
            }}
          >
            <video
              ref={videoRef}
              className={styles.hiddenVideo}
              src={src}
              muted
              loop
              playsInline
              preload="auto"
            />

            {isLoading && (
              <div className={styles.loading}>Rendering ASCII video</div>
            )}

            {!isLoading && !didFail && (
              <pre className={styles.asciiPre} role="img" aria-label={alt}>
                {asciiOutput}
              </pre>
            )}

            {!isLoading && didFail && (
              <video
                className={styles.fallbackVideo}
                src={src}
                muted
                loop
                playsInline
                autoPlay
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AsciiVideoPortrait;
