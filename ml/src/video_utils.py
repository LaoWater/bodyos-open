"""
Video Utilities — Convert .mov to .mp4 and other preprocessing helpers.

Usage:
    python -m src.video_utils data/raw_videos/pushup/pushup.mov
    python -m src.video_utils data/raw_videos/  # converts all .mov files recursively
"""

import subprocess
import sys
from pathlib import Path


def convert_mov_to_mp4(mov_path: str, output_path: str | None = None) -> str:
    """Convert a .mov file to .mp4 using ffmpeg.

    Args:
        mov_path: Path to the .mov file
        output_path: Optional output path. Defaults to same name with .mp4 extension.

    Returns:
        Path to the output .mp4 file
    """
    mov = Path(mov_path)
    if not mov.exists():
        raise FileNotFoundError(f"File not found: {mov_path}")

    if mov.suffix.lower() != ".mov":
        raise ValueError(f"Expected .mov file, got: {mov.suffix}")

    if output_path is None:
        output_path = str(mov.with_suffix(".mp4"))

    out = Path(output_path)
    if out.exists():
        print(f"  Skipping (already exists): {out.name}")
        return str(out)

    print(f"  Converting: {mov.name} -> {out.name}")

    try:
        subprocess.run(
            [
                "ffmpeg", "-i", str(mov),
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "23",
                "-c:a", "aac",
                "-y",  # overwrite
                str(out),
            ],
            capture_output=True,
            text=True,
            check=True,
        )
    except FileNotFoundError:
        print("  WARNING: ffmpeg not found. Install ffmpeg or convert manually.")
        print("  OpenCV can read .mov files directly, so conversion is optional.")
        return str(mov)
    except subprocess.CalledProcessError as e:
        print(f"  WARNING: ffmpeg conversion failed: {e.stderr[:200]}")
        print("  OpenCV can usually read .mov files directly.")
        return str(mov)

    print(f"  Done: {out.name} ({out.stat().st_size / 1024 / 1024:.1f} MB)")
    return str(out)


def convert_all_mov(directory: str) -> list[str]:
    """Convert all .mov files in a directory tree to .mp4.

    Args:
        directory: Root directory to search for .mov files

    Returns:
        List of output .mp4 paths
    """
    root = Path(directory)
    mov_files = sorted(root.rglob("*.mov"))

    if not mov_files:
        print(f"No .mov files found in {directory}")
        return []

    print(f"Found {len(mov_files)} .mov file(s) to convert:\n")
    results = []

    for mov in mov_files:
        result = convert_mov_to_mp4(str(mov))
        results.append(result)

    return results


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m src.video_utils <path>")
        print("  <path> can be a .mov file or a directory to scan recursively")
        sys.exit(1)

    target = Path(sys.argv[1])

    if target.is_file():
        convert_mov_to_mp4(str(target))
    elif target.is_dir():
        convert_all_mov(str(target))
    else:
        print(f"Not found: {target}")
        sys.exit(1)
