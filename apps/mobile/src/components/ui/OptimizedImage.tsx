import React from 'react';
import { Image, type ImageProps } from 'expo-image';
import { IMAGE_REGISTRY, type ImageName, type ImageVariant } from '../../constants/imageRegistry';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  /** Image name from the registry */
  name: ImageName;
  /** Size variant - falls back gracefully if requested variant is missing */
  variant?: ImageVariant;
}

const FALLBACK_ORDER: ImageVariant[] = ['medium', 'full', 'thumb'];

/**
 * Optimized image component using expo-image with WebP assets.
 * Provides automatic caching, smooth transitions, and right-sized variants.
 */
export function OptimizedImage({ name, variant = 'medium', style, ...rest }: OptimizedImageProps) {
  const entry = IMAGE_REGISTRY[name];

  // Resolve source: try requested variant, then fallback chain
  const entryRecord = entry as Record<string, number | undefined>;
  const source =
    entryRecord[variant] ??
    FALLBACK_ORDER.reduce<number | undefined>(
      (found, v) => found ?? entryRecord[v],
      undefined,
    );

  if (!source) {
    // Should never happen if registry is populated correctly
    return null;
  }

  return (
    <Image
      source={source}
      transition={200}
      cachePolicy="memory-disk"
      style={style}
      {...rest}
    />
  );
}
