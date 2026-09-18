'use client';

import type { ImageLoaderProps } from 'next/image';
import { transformStoryblokImageUrl } from './storyblok-image';

export default function storyblokImageLoader({ src, width, quality }: ImageLoaderProps) {
  return transformStoryblokImageUrl(src, { width, quality: quality ?? 70 });
}
