from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


def resize_premultiplied(image: Image.Image, scale: int) -> Image.Image:
    # The supplied strip contains a 1-2 px, nearly opaque chromatic fringe.
    # Remove that contaminated outer ring, then rebuild a soft antialiased edge.
    clean_alpha = image.getchannel("A").filter(ImageFilter.MinFilter(7)).filter(
        ImageFilter.GaussianBlur(0.75)
    )
    source = np.asarray(image).copy()
    filled = np.asarray(clean_alpha) >= 128
    for _ in range(8):
        unresolved = ~filled
        if not unresolved.any():
            break
        color_sum = np.zeros_like(source[:, :, :3], dtype=np.uint16)
        count = np.zeros(source.shape[:2], dtype=np.uint8)
        for colors, known in (
            (np.pad(source[:-1, :, :3], ((1, 0), (0, 0), (0, 0))), np.pad(filled[:-1], ((1, 0), (0, 0)))),
            (np.pad(source[1:, :, :3], ((0, 1), (0, 0), (0, 0))), np.pad(filled[1:], ((0, 1), (0, 0)))),
            (np.pad(source[:, :-1, :3], ((0, 0), (1, 0), (0, 0))), np.pad(filled[:, :-1], ((0, 0), (1, 0)))),
            (np.pad(source[:, 1:, :3], ((0, 0), (0, 1), (0, 0))), np.pad(filled[:, 1:], ((0, 0), (0, 1)))),
        ):
            color_sum += colors.astype(np.uint16) * known[:, :, None]
            count += known
        take = unresolved & (count > 0)
        source[take, :3] = (color_sum[take] / count[take, None]).astype(np.uint8)
        filled[take] = True
    image = Image.fromarray(source, "RGBA")
    image = image.copy()
    image.putalpha(clean_alpha)
    size = (image.width * scale, image.height * scale)
    # Resize premultiplied color so transparent edge pixels cannot create dark
    # or colored square halos during browser interpolation.
    result = image.convert("RGBa").resize(size, Image.Resampling.LANCZOS).convert("RGBA")
    alpha = result.getchannel("A").point(lambda value: 0 if value < 3 else value)
    result.putalpha(alpha)
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description="Create HiDPI animation frames without regenerating artwork.")
    parser.add_argument("source_dir", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("--scale", type=int, default=2)
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    frames: list[Image.Image] = []
    for source_path in sorted(args.source_dir.glob("frame-*.png")):
        image = Image.open(source_path).convert("RGBA")
        output = resize_premultiplied(image, args.scale)
        output.save(args.output_dir / source_path.name, optimize=True)
        frames.append(output)

    report = json.loads((args.source_dir / "alignment-report.json").read_text(encoding="utf-8"))
    report["source_aligned_frames"] = str(args.source_dir)
    report["output_canvas"] = {"width": frames[0].width, "height": frames[0].height}
    report["hidpi_scale"] = args.scale
    report["edge_processing"] = "remove 2 px chromatic source fringe; rebuild soft Alpha edge; premultiplied-alpha Lanczos; Alpha below 3 removed"
    report["character_geometry_changed"] = False
    (args.output_dir / "quality-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )


if __name__ == "__main__":
    main()
