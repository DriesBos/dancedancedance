'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import GrainyGradient from '@/components/GrainyGradient';
import styles from './AsciiPortrait.module.sass';

const DEFAULT_CHARSET = '@#W$9876543210?!abc;:+=-,._ ';
const CHAR_ASPECT_RATIO = 0.56;
const MIN_COLUMNS = 160;
const MAX_COLUMNS = 500;
const MIN_ROWS = 28;
const MAX_ROWS = 180;

interface AsciiPortraitProps {
  src: string;
  alt?: string;
  caption?: string;
  density?: number;
  contrast?: number;
  invert?: boolean;
  charset?: string;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const AsciiPortrait = ({
  src,
  alt = 'ASCII portrait',
  caption,
  density = 10,
  contrast = 1,
  invert = false,
  charset = DEFAULT_CHARSET,
}: AsciiPortraitProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [asciiOutput, setAsciiOutput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [didFail, setDidFail] = useState(false);

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
    if (!src || containerWidth <= 0) {
      setAsciiOutput('');
      setDidFail(false);
      setIsLoading(false);
      return;
    }

    let didCancel = false;
    setIsLoading(true);
    setDidFail(false);

    const sourceImage = new window.Image();
    sourceImage.crossOrigin = 'anonymous';
    sourceImage.decoding = 'async';

    sourceImage.onload = () => {
      if (didCancel) return;

      try {
        const sourceWidth = sourceImage.naturalWidth || sourceImage.width;
        const sourceHeight = sourceImage.naturalHeight || sourceImage.height;

        if (!sourceWidth || !sourceHeight) {
          throw new Error('Image dimensions could not be resolved.');
        }

        const columns = clamp(
          Math.round((containerWidth / 7.5) * clamp(density, 0.5, 2.2)),
          MIN_COLUMNS,
          MAX_COLUMNS,
        );
        const rows = clamp(
          Math.round(
            ((columns * sourceHeight) / sourceWidth) * CHAR_ASPECT_RATIO,
          ),
          MIN_ROWS,
          MAX_ROWS,
        );

        const canvas = document.createElement('canvas');
        canvas.width = columns;
        canvas.height = rows;
        const context = canvas.getContext('2d', { willReadFrequently: true });

        if (!context) {
          throw new Error('Canvas context unavailable.');
        }

        context.drawImage(sourceImage, 0, 0, columns, rows);
        const { data } = context.getImageData(0, 0, columns, rows);
        const charsetToUse =
          (charset && charset.length > 1
            ? charset
            : DEFAULT_CHARSET
          ).trimEnd() + ' ';
        const charsetLength = charsetToUse.length - 1;
        const contrastToUse = clamp(contrast, 0.6, 2.8);
        const lines: string[] = new Array(rows);

        for (let y = 0; y < rows; y += 1) {
          let line = '';

          for (let x = 0; x < columns; x += 1) {
            const pixelIndex = (y * columns + x) * 4;
            const alpha = data[pixelIndex + 3];

            if (alpha < 32) {
              line += '\u00A0';
              continue;
            }

            const red = data[pixelIndex];
            const green = data[pixelIndex + 1];
            const blue = data[pixelIndex + 2];

            let luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
            luminance = (luminance - 128) * contrastToUse + 128;
            luminance = clamp(luminance, 0, 255);

            if (invert) {
              luminance = 255 - luminance;
            }

            const normalized = luminance / 255;
            const charIndex = Math.round(normalized * charsetLength);
            const char = charsetToUse[charIndex] || ' ';
            line += char === ' ' ? '\u00A0' : char;
          }

          lines[y] = line;
        }

        setAsciiOutput(lines.join('\n'));
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to generate ASCII portrait:', error);
        setDidFail(true);
        setIsLoading(false);
      }
    };

    sourceImage.onerror = () => {
      if (didCancel) return;
      setDidFail(true);
      setIsLoading(false);
    };

    sourceImage.src = src;

    return () => {
      didCancel = true;
      sourceImage.onload = null;
      sourceImage.onerror = null;
    };
  }, [charset, containerWidth, contrast, density, invert, src]);

  return (
    <div className="blok blok-Portrait blok-Animate">
      <GrainyGradient variant="blok" />
      <div className="row">
        <div className="column column-Image">
          <div ref={containerRef} className={`${styles.frame} imageItem`}>
            {isLoading && (
              <div className={styles.loading}>Rendering ASCII portrait</div>
            )}
            {!isLoading && !didFail && (
              <pre className={styles.asciiPre} role="img" aria-label={alt}>
                {asciiOutput}
              </pre>
            )}
            {!isLoading && didFail && (
              <Image
                src={src}
                alt={alt}
                width={0}
                height={0}
                sizes="100vw"
                className={styles.fallbackImage}
                quality={80}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
          </div>
          {caption && <div className="column-Caption">{caption}</div>}
        </div>
      </div>
    </div>
  );
};

export default AsciiPortrait;
