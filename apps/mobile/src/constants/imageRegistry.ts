/**
 * Image Registry - Single source of truth for optimized image assets.
 *
 * All images go through utils/optimize_images.py which generates WebP variants:
 *   - thumb:  max 200px  (tiny thumbnails like 56x75)
 *   - medium: max 500px  (guide images, capture slots, logos)
 *   - full:   max 1024px (fullscreen backgrounds)
 *
 * Run: python utils/optimize_images.py
 */

export type ImageVariant = 'thumb' | 'medium' | 'full';

export type ImageEntry = Partial<Record<ImageVariant, number>>; // number = require() return

export const IMAGE_REGISTRY = {
  'anterior-view': {
    full: require('../../assets/optimized/full/anterior-view.webp'),
    medium: require('../../assets/optimized/medium/anterior-view.webp'),
    thumb: require('../../assets/optimized/thumb/anterior-view.webp'),
  },
  'right-side-view': {
    full: require('../../assets/optimized/full/right-side-view.webp'),
    medium: require('../../assets/optimized/medium/right-side-view.webp'),
    thumb: require('../../assets/optimized/thumb/right-side-view.webp'),
  },
  'posterior-view': {
    full: require('../../assets/optimized/full/posterior-view.webp'),
    medium: require('../../assets/optimized/medium/posterior-view.webp'),
    thumb: require('../../assets/optimized/thumb/posterior-view.webp'),
  },
  'left-side-view': {
    full: require('../../assets/optimized/full/left-side-view.webp'),
    medium: require('../../assets/optimized/medium/left-side-view.webp'),
    thumb: require('../../assets/optimized/thumb/left-side-view.webp'),
  },
  'body-os-headquarters': {
    medium: require('../../assets/optimized/medium/body-os-headquarters.webp'),
  },
  'grey-logo-vertical': {
    medium: require('../../assets/optimized/medium/grey-logo-vertical.webp'),
  },
  'bodyos-blueprints-vertical': {
    full: require('../../assets/optimized/full/bodyos-blueprints-vertical.webp'),
  },
} as const;

export type ImageName = keyof typeof IMAGE_REGISTRY;
