# Image Optimization Toolkit

Portable system for converting PNG/JPEG to optimized WebP with size variants. Uses Python + Pillow. Works with any project.

---

## Setup (one-time)

```bash
pip install Pillow
```

## File Structure

```
your-project/
  assets/                        # Original images (source of truth)
  assets/optimized/
    thumb/   filename.webp       # max 200px  - tiny thumbnails
    medium/  filename.webp       # max 500px  - cards, logos, guides
    full/    filename.webp       # max 1024px - fullscreen backgrounds
  utils/
    optimize_images.py           # The script
    image_manifest.json          # Per-image config
```

---

## Adding a New Image (Step by Step)

> Example: You have a new image called `hero-banner.png` that will be shown as a fullscreen background.

### Step 1: Put the image in `assets/`

Drop your PNG or JPEG file into the `assets/` folder at the project root.

```
assets/hero-banner.png   <-- your new file goes here
```

### Step 2: Register it in the manifest

Open `utils/image_manifest.json`. Find the `"images"` object and add your file at the end, **before the closing `}`**:

```json
    "hero-banner.png": {
      "variants": ["medium", "full"],
      "quality": 82,
      "notes": "Fullscreen hero background"
    }
```

**Which variants do I pick?** Look at how big the image is displayed in the app:

| How it's displayed | What to put in `"variants"` |
|---|---|
| Tiny thumbnail (under 80px) | `["thumb"]` |
| Card, logo, small preview (80-400px) | `["thumb", "medium"]` |
| Large image or fullscreen background | `["medium", "full"]` |
| Used at multiple sizes across screens | `["thumb", "medium", "full"]` |
| Not sure | `["thumb", "medium", "full"]` (safe default) |

**What quality?** Use `82` as default. Use `90` for logos with transparency. Use `70` if it sits behind a dark overlay.

### Step 3: Run the script

From the project root:

```bash
python3 utils/optimize_images.py --input hero-banner.png
```

You'll see output confirming the WebP files were created:

```
  hero-banner.png (1.2MB)
  OK    medium  375x500  q82  18.2KB  (98% saving)  -> assets/optimized/medium/hero-banner.webp
  OK      full  768x1024  q82  62.1KB  (95% saving)  -> assets/optimized/full/hero-banner.webp
```

Verify the files exist:
```bash
ls assets/optimized/medium/hero-banner.webp
ls assets/optimized/full/hero-banner.webp
```

### Step 4: Add to the image registry

Open `src/constants/imageRegistry.ts`. Add your image inside the `IMAGE_REGISTRY` object. **The key is the filename without extension.** Each line must match a variant you generated in Step 2:

```typescript
export const IMAGE_REGISTRY = {
  // ... existing images ...

  'hero-banner': {
    medium: require('../../assets/optimized/medium/hero-banner.webp'),
    full: require('../../assets/optimized/full/hero-banner.webp'),
  },
} as const;
```

### Step 5: Use it in your screen/component

```tsx
import { OptimizedImage } from '../components/ui/OptimizedImage';

// Pick the variant closest to your display size:
//   thumb  = under 80px
//   medium = 80-400px
//   full   = 400px+ or fullscreen

<OptimizedImage
  name="hero-banner"
  variant="full"
  style={{ width: '100%', height: 300 }}
  contentFit="cover"
/>
```

That's it. The image is now optimized, cached, and served at the right size.

---

## Replacing an Existing Image

> Example: You want to swap `anterior-view` with a new photo.

### Step 1: Replace the original

Delete (or overwrite) the old file in `assets/` with your new one. **Keep the same filename.**

```
assets/anterior-view.png   <-- replace this file
```

### Step 2: Regenerate the WebP variants

```bash
python3 utils/optimize_images.py --input anterior-view.png
```

This overwrites the old WebP files in `assets/optimized/`.

### Step 3: Done

No code changes needed. The registry and components already point to the right files.

---

## Removing an Image

### Step 1: Delete the require() lines from `src/constants/imageRegistry.ts`
### Step 2: Remove any `<OptimizedImage name="..." />` usage from your screens
### Step 3: Remove the entry from `utils/image_manifest.json`
### Step 4: Delete the files

```bash
rm assets/my-image.png
rm assets/optimized/thumb/my-image.webp
rm assets/optimized/medium/my-image.webp
rm assets/optimized/full/my-image.webp
```

---

## CLI Reference

```bash
python3 utils/optimize_images.py                       # Process all images
python3 utils/optimize_images.py --dry-run              # Preview only (no files written)
python3 utils/optimize_images.py --input hero.png       # Process one file
python3 utils/optimize_images.py --skip-existing        # Only generate missing variants
python3 utils/optimize_images.py --quality 90           # Override quality for all
```

---

## Manifest Reference

```json
{
  "defaults": {
    "quality": 82,
    "variants": ["thumb", "medium", "full"]
  },
  "variant_sizes": {
    "thumb": 200,
    "medium": 500,
    "full": 1024
  },
  "images": {
    "filename.png": {
      "variants": ["thumb", "medium", "full"],
      "quality": 82,
      "notes": "Human-readable context"
    },
    "splash.png": {
      "skip": true,
      "notes": "Must stay PNG for app.json"
    }
  }
}
```

`variant_sizes` are customizable per-project. The defaults (200/500/1024) work well for mobile. For web you might want `"full": 1920`.

---

## OptimizedImage Component API

```tsx
<OptimizedImage
  name="hero-banner"        // Required. Key from imageRegistry.ts (filename without extension)
  variant="medium"          // Optional. "thumb" | "medium" | "full". Default: "medium"
  contentFit="cover"        // Optional. "cover" | "contain" | "fill" | "none"
  style={styles.image}      // Standard React Native style
/>
```

- If the requested variant doesn't exist for that image, it falls back: `medium` -> `full` -> `thumb`
- Built-in 200ms fade-in transition
- Disk + memory caching via expo-image

For user photos or remote URLs (not in the registry), use `expo-image` directly:
```tsx
import { Image } from 'expo-image';

<Image source={{ uri: photoUrl }} cachePolicy="memory-disk" contentFit="cover" style={styles.photo} />
```

---

## Porting to Another Project

1. Copy `utils/optimize_images.py` and `utils/image_manifest.json`
2. Clear the `"images"` object in the manifest, keep `"defaults"` and `"variant_sizes"`
3. Install `expo-image` (React Native) or use `<img>` with WebP (web)
4. Create your own `imageRegistry.ts` and `OptimizedImage` wrapper
5. Add your images and run
