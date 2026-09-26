from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "assets" / "character-portraits"
OUTPUT_DIR = SOURCE_DIR / "calibration-tests" / "human-mage-v1"
SCALES = [1.0, 1.0166, 0.9965, 1.0407]
SOURCE_FOOT_Y = [1416, 1418, 1447, 1440]
SOURCE_TORSO_X = [584.31, 584.96, 593.59, 614.90]
CANVAS_SIZE = (1408, 1664)
TARGET_FOOT_Y = 1540
TARGET_TORSO_X = 704


def alpha_bbox(image: Image.Image, threshold: int = 0) -> dict[str, float | int]:
    alpha = np.asarray(image.getchannel("A"))
    ys, xs = np.where(alpha > threshold)
    left, right = int(xs.min()), int(xs.max())
    top, bottom = int(ys.min()), int(ys.max())
    return {
        "left": left,
        "top": top,
        "right": right,
        "bottom": bottom,
        "width": right - left + 1,
        "height": bottom - top + 1,
        "center_x": round((left + right) / 2, 2),
    }


def premultiplied_resize(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    # Resampling premultiplied RGBA prevents hidden RGB colors from bleeding into
    # the antialiased transparent edge.
    return image.convert("RGBa").resize(size, Image.Resampling.LANCZOS).convert("RGBA")


def tint(image: Image.Image, color: tuple[int, int, int]) -> Image.Image:
    alpha = image.getchannel("A")
    tinted = Image.new("RGBA", image.size, (*color, 0))
    tinted.putalpha(alpha)
    return tinted


def make_overlay(reference: Image.Image, comparison: Image.Image) -> Image.Image:
    canvas = Image.new("RGBA", reference.size, (8, 12, 24, 255))
    red = tint(reference, (255, 70, 70))
    cyan = tint(comparison, (70, 235, 255))
    red.putalpha(red.getchannel("A").point(lambda value: value // 2))
    cyan.putalpha(cyan.getchannel("A").point(lambda value: value // 2))
    canvas.alpha_composite(red)
    canvas.alpha_composite(cyan)
    return canvas


def make_difference(reference: Image.Image, comparison: Image.Image) -> Image.Image:
    difference = ImageChops.difference(reference, comparison)
    boosted = difference.convert("RGB").point(lambda value: min(255, value * 3))
    return boosted.convert("RGBA")


def comparison_metrics(reference: Image.Image, comparison: Image.Image) -> dict[str, float]:
    ref = np.asarray(reference).astype(np.int16)
    other = np.asarray(comparison).astype(np.int16)
    ref_mask = ref[:, :, 3] > 127
    other_mask = other[:, :, 3] > 127
    union = ref_mask | other_mask
    intersection = ref_mask & other_mask
    overlap = intersection.sum() / max(1, union.sum())
    rgb_mae = np.abs(ref[:, :, :3] - other[:, :, :3])[intersection].mean() if intersection.any() else 0
    return {"opaque_alpha_iou": round(float(overlap), 4), "overlap_rgb_mae": round(float(rgb_mae), 2)}


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    corrected: list[Image.Image] = []
    report: dict[str, object] = {
        "canvas": {"width": CANVAS_SIZE[0], "height": CANVAS_SIZE[1]},
        "target_foot_y": TARGET_FOOT_Y,
        "target_torso_x": TARGET_TORSO_X,
        "frames": [],
        "comparisons_to_frame_1": [],
    }

    for index, (scale, foot_y, torso_x) in enumerate(zip(SCALES, SOURCE_FOOT_Y, SOURCE_TORSO_X), 1):
        source_path = SOURCE_DIR / f"human-mage-idle-{index:02d}.png"
        source = Image.open(source_path).convert("RGBA")
        scaled_size = (round(source.width * scale), round(source.height * scale))
        scaled = premultiplied_resize(source, scaled_size)
        effective_scale_x = scaled.width / source.width
        effective_scale_y = scaled.height / source.height
        offset_x = round(TARGET_TORSO_X - torso_x * effective_scale_x)
        offset_y = round(TARGET_FOOT_Y - foot_y * effective_scale_y)
        canvas = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
        canvas.alpha_composite(scaled, (offset_x, offset_y))
        output_path = OUTPUT_DIR / f"human-mage-calibrated-{index:02d}.png"
        canvas.save(output_path, optimize=True)
        corrected.append(canvas)
        report["frames"].append({
            "frame": index,
            "source": source_path.relative_to(ROOT).as_posix(),
            "output": output_path.relative_to(ROOT).as_posix(),
            "requested_scale": scale,
            "effective_scale_x": round(effective_scale_x, 6),
            "effective_scale_y": round(effective_scale_y, 6),
            "offset_x": offset_x,
            "offset_y": offset_y,
            "source_alpha_bbox": alpha_bbox(source),
            "corrected_alpha_bbox": alpha_bbox(canvas),
            "anchored_foot_y": round(foot_y * effective_scale_y + offset_y, 2),
            "anchored_torso_x": round(torso_x * effective_scale_x + offset_x, 2),
        })

    reference = corrected[0]
    for index, image in enumerate(corrected[1:], 2):
        overlay_path = OUTPUT_DIR / f"overlay-frame-01-vs-{index:02d}.png"
        difference_path = OUTPUT_DIR / f"difference-frame-01-vs-{index:02d}.png"
        make_overlay(reference, image).save(overlay_path, optimize=True)
        make_difference(reference, image).save(difference_path, optimize=True)
        report["comparisons_to_frame_1"].append({
            "frame": index,
            "overlay": overlay_path.relative_to(ROOT).as_posix(),
            "difference": difference_path.relative_to(ROOT).as_posix(),
            **comparison_metrics(reference, image),
        })

    thumb_size = (320, 416)
    sheet = Image.new("RGBA", (thumb_size[0] * 4, thumb_size[1] + 44), (8, 12, 24, 255))
    draw = ImageDraw.Draw(sheet)
    for index, image in enumerate(corrected, 1):
        thumb = image.copy()
        thumb.thumbnail(thumb_size, Image.Resampling.LANCZOS)
        sheet.alpha_composite(thumb, ((index - 1) * thumb_size[0], 0))
        draw.text(((index - 1) * thumb_size[0] + 12, thumb_size[1] + 12), f"Corrected frame {index}", fill=(235, 240, 255, 255))
    sheet.save(OUTPUT_DIR / "corrected-contact-sheet.png", optimize=True)
    (OUTPUT_DIR / "calibration-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
