#!/usr/bin/env python3
"""
BodyOS Image Optimizer
Batch converts PNG/JPEG to WebP with size variants using Pillow.

Usage:
    python utils/optimize_images.py                    # Process all images in manifest
    python utils/optimize_images.py --dry-run          # Preview without writing
    python utils/optimize_images.py --input FILE       # Process a single file
    python utils/optimize_images.py --quality 85       # Override default quality
    python utils/optimize_images.py --skip-existing    # Skip already-converted files
"""

import argparse
import json
import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Pillow is required. Install with: pip install Pillow")
    sys.exit(1)


SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
ASSETS_DIR = PROJECT_DIR / "assets"
OUTPUT_DIR = ASSETS_DIR / "optimized"
MANIFEST_PATH = SCRIPT_DIR / "image_manifest.json"


def load_manifest() -> dict:
    with open(MANIFEST_PATH, "r") as f:
        return json.load(f)


def get_output_path(variant: str, filename: str) -> Path:
    stem = Path(filename).stem
    return OUTPUT_DIR / variant / f"{stem}.webp"


def optimize_image(
    filepath: Path,
    config: dict,
    variant_sizes: dict,
    quality_override: int | None = None,
    dry_run: bool = False,
    skip_existing: bool = False,
) -> list[dict]:
    """Convert a single image to WebP at specified variants. Returns stats."""
    results = []
    filename = filepath.name

    if config.get("skip"):
        print(f"  SKIP  {filename} ({config.get('notes', 'marked skip')})")
        return results

    variants = config.get("variants", ["thumb", "medium", "full"])
    quality = quality_override or config.get("quality", 82)

    original_size = filepath.stat().st_size

    try:
        img = Image.open(filepath)
    except Exception as e:
        print(f"  ERROR  Cannot open {filename}: {e}")
        return results

    # Preserve alpha channel
    has_alpha = img.mode in ("RGBA", "LA", "PA")

    for variant in variants:
        max_dim = variant_sizes.get(variant)
        if max_dim is None:
            print(f"  WARN  Unknown variant '{variant}' for {filename}")
            continue

        out_path = get_output_path(variant, filename)

        if skip_existing and out_path.exists():
            print(f"  EXISTS {variant:>6s}  {out_path.relative_to(PROJECT_DIR)}")
            continue

        # Resize maintaining aspect ratio
        resized = img.copy()
        resized.thumbnail((max_dim, max_dim), Image.LANCZOS)
        w, h = resized.size

        if dry_run:
            # Estimate output size (rough: ~10-15% of uncompressed for WebP)
            est_bytes = int(w * h * (4 if has_alpha else 3) * 0.08)
            saving_pct = (1 - est_bytes / original_size) * 100 if original_size > 0 else 0
            print(
                f"  DRY   {variant:>6s}  {w}x{h}  q{quality}  "
                f"~{_fmt_size(est_bytes)}  ({saving_pct:.0f}% saving)  "
                f"-> {out_path.relative_to(PROJECT_DIR)}"
            )
            results.append({
                "file": filename,
                "variant": variant,
                "estimated_size": est_bytes,
                "original_size": original_size,
            })
        else:
            out_path.parent.mkdir(parents=True, exist_ok=True)

            # Convert to appropriate mode for WebP
            if has_alpha:
                save_img = resized.convert("RGBA")
            else:
                save_img = resized.convert("RGB")

            save_img.save(out_path, "WEBP", quality=quality, method=4)
            new_size = out_path.stat().st_size
            saving_pct = (1 - new_size / original_size) * 100 if original_size > 0 else 0

            print(
                f"  OK    {variant:>6s}  {w}x{h}  q{quality}  "
                f"{_fmt_size(new_size)}  ({saving_pct:.0f}% saving)  "
                f"-> {out_path.relative_to(PROJECT_DIR)}"
            )
            results.append({
                "file": filename,
                "variant": variant,
                "output_size": new_size,
                "original_size": original_size,
            })

    return results


def _fmt_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes}B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f}KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f}MB"


def main():
    parser = argparse.ArgumentParser(description="BodyOS Image Optimizer")
    parser.add_argument("--dry-run", action="store_true", help="Preview conversions without writing files")
    parser.add_argument("--quality", type=int, help="Override quality (1-100)")
    parser.add_argument("--input", type=str, help="Process a single file by name")
    parser.add_argument("--skip-existing", action="store_true", help="Skip files that already exist")
    args = parser.parse_args()

    if not MANIFEST_PATH.exists():
        print(f"Manifest not found: {MANIFEST_PATH}")
        sys.exit(1)

    manifest = load_manifest()
    variant_sizes = manifest.get("variant_sizes", {"thumb": 200, "medium": 500, "full": 1024})
    images = manifest.get("images", {})

    if args.input:
        # Single file mode
        if args.input not in images:
            print(f"'{args.input}' not found in manifest. Add it to image_manifest.json first.")
            sys.exit(1)
        images = {args.input: images[args.input]}

    print(f"\nBodyOS Image Optimizer")
    print(f"{'=' * 60}")
    print(f"  Source:  {ASSETS_DIR}")
    print(f"  Output:  {OUTPUT_DIR}")
    print(f"  Mode:    {'DRY RUN' if args.dry_run else 'LIVE'}")
    print(f"  Images:  {len(images)}")
    print(f"{'=' * 60}\n")

    all_results = []
    total_original = 0
    total_output = 0

    for filename, config in images.items():
        filepath = ASSETS_DIR / filename
        if not filepath.exists():
            print(f"  MISS  {filename} (file not found in assets/)")
            continue

        print(f"  {filename} ({_fmt_size(filepath.stat().st_size)})")
        results = optimize_image(
            filepath,
            config,
            variant_sizes,
            quality_override=args.quality,
            dry_run=args.dry_run,
            skip_existing=args.skip_existing,
        )
        all_results.extend(results)

        for r in results:
            total_original += r["original_size"]
            total_output += r.get("output_size", r.get("estimated_size", 0))

        print()

    # Summary
    print(f"{'=' * 60}")
    print(f"  Summary")
    print(f"{'=' * 60}")
    print(f"  Files processed:  {len(all_results)}")
    print(f"  Original total:   {_fmt_size(total_original)}")
    print(f"  Output total:     {_fmt_size(total_output)}")
    if total_original > 0:
        saving = (1 - total_output / total_original) * 100
        print(f"  Overall saving:   {saving:.0f}%")
    print()


if __name__ == "__main__":
    main()
