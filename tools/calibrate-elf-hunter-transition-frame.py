from pathlib import Path
import json
import shutil

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-96635b23-fde2-4023-9c22-186a105deb4a.png")
OUTPUT = ROOT / "assets" / "character-portraits" / "calibration-tests" / "elf-hunter-five-frame-v1"
FRAME_PATH = OUTPUT / "frame-04-05-transition.png"
CANVAS = (1200, 1536)
TARGET_BODY_HEIGHT = 1080
TARGET_CENTER_X = 600
TARGET_FOOT_Y = 1500


def analyze(image):
    rgba = np.asarray(image.convert("RGBA"))
    alpha = rgba[:, :, 3]
    visible = alpha > 8
    stable = alpha > 32
    ys, xs = np.where(visible)
    bbox = [int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)]
    row_counts = stable.sum(axis=1)
    head_y = next(
        y for y in range(image.height - 7)
        if np.count_nonzero(row_counts[y:y + 8] >= 80) >= 7
    )
    foot_y = int(np.where(row_counts > 10)[0].max())
    body_height = foot_y - head_y + 1
    grid_y, grid_x = np.indices(stable.shape)
    lower = stable & (grid_y >= foot_y - 0.30 * body_height)
    lower_x = grid_x[lower]
    lo, hi = np.quantile(lower_x, [0.08, 0.92])
    foot_center = float(np.median(lower_x[(lower_x >= lo) & (lower_x <= hi)]))
    torso_region = (
        stable
        & (grid_y >= head_y + 0.30 * body_height)
        & (grid_y <= head_y + 0.62 * body_height)
        & (grid_x >= foot_center - 0.24 * body_height)
        & (grid_x <= foot_center + 0.24 * body_height)
    )
    torso_y, torso_x = np.where(torso_region)
    weights = alpha[torso_y, torso_x].astype(float)
    order = np.argsort(torso_x)
    sorted_x = torso_x[order]
    cumulative = np.cumsum(weights[order])
    torso_center_x = float(sorted_x[np.searchsorted(cumulative, cumulative[-1] / 2)])
    return {
        "canvas": [image.width, image.height],
        "alpha_bbox": bbox,
        "alpha_width": bbox[2] - bbox[0],
        "alpha_height": bbox[3] - bbox[1],
        "visual_head_y": head_y,
        "foot_y": foot_y,
        "visual_body_height": body_height,
        "torso_center_x": torso_center_x,
    }


def resize_premultiplied(image, size):
    rgba = np.asarray(image.convert("RGBA"), dtype=np.float32)
    alpha = rgba[:, :, 3:4] / 255.0
    premultiplied = np.concatenate((rgba[:, :, :3] * alpha, rgba[:, :, 3:4]), axis=2)
    resized = np.asarray(
        Image.fromarray(np.clip(premultiplied, 0, 255).astype(np.uint8), "RGBA").resize(size, Image.Resampling.LANCZOS),
        dtype=np.float32,
    )
    out_alpha = resized[:, :, 3:4]
    rgb = np.divide(resized[:, :, :3] * 255.0, out_alpha, out=np.zeros_like(resized[:, :, :3]), where=out_alpha > 0)
    return Image.fromarray(np.clip(np.concatenate((rgb, out_alpha), axis=2), 0, 255).astype(np.uint8), "RGBA")


def main():
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    previous_source = OUTPUT / "source-transition-04-05.png"
    previous_frame = OUTPUT / "frame-04-05-transition.png"
    if previous_source.exists() and not (OUTPUT / "source-transition-04-05-v1.png").exists():
        shutil.copy2(previous_source, OUTPUT / "source-transition-04-05-v1.png")
    if previous_frame.exists() and not (OUTPUT / "frame-04-05-transition-v1.png").exists():
        shutil.copy2(previous_frame, OUTPUT / "frame-04-05-transition-v1.png")
    shutil.copy2(SOURCE, OUTPUT / "source-transition-04-05.png")
    source = Image.open(SOURCE).convert("RGBA")
    metric = analyze(source)
    scale = TARGET_BODY_HEIGHT / metric["visual_body_height"]
    resized = resize_premultiplied(source, (round(source.width * scale), round(source.height * scale)))
    translation_x = round(TARGET_CENTER_X - metric["torso_center_x"] * scale)
    translation_y = round(TARGET_FOOT_Y - metric["foot_y"] * scale)
    frame = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    frame.alpha_composite(resized, (translation_x, translation_y))
    frame.save(FRAME_PATH, compress_level=6)

    metric.update({
        "scale": round(scale, 6),
        "translation_x": translation_x,
        "translation_y": translation_y,
        "corrected_visual_body_height": TARGET_BODY_HEIGHT,
        "corrected_head_y": round(translation_y + metric["visual_head_y"] * scale, 2),
        "corrected_foot_y": round(translation_y + metric["foot_y"] * scale, 2),
        "corrected_torso_center_x": round(translation_x + metric["torso_center_x"] * scale, 2),
    })
    report = {
        "method": "Transition frame only; existing five corrected frames unchanged",
        "insert_after": "frame-04.png",
        "insert_before": "frame-05.png",
        "target_visual_body_height": TARGET_BODY_HEIGHT,
        "target_foot_y": TARGET_FOOT_Y,
        "target_torso_center_x": TARGET_CENTER_X,
        "transition": metric,
    }
    (OUTPUT / "transition-analysis.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    comparison_paths = [OUTPUT / "frame-04.png", FRAME_PATH, OUTPUT / "frame-05.png"]
    thumb_size = (300, 384)
    contact = Image.new("RGBA", (900, 384), (24, 29, 43, 255))
    for index, path in enumerate(comparison_paths):
        image = Image.open(path).convert("RGBA").resize(thumb_size, Image.Resampling.LANCZOS)
        contact.alpha_composite(image, (index * 300, 0))
    contact.save(OUTPUT / "transition-contact-sheet.png")

    colors = [(80, 200, 255, 110), (255, 210, 80, 110), (220, 110, 255, 110)]
    overlay = Image.new("RGBA", CANVAS, (0, 0, 0, 255))
    for path, color in zip(comparison_paths, colors):
        image = Image.open(path).convert("RGBA")
        tint = Image.new("RGBA", CANVAS, color)
        tint.putalpha(image.getchannel("A").point(lambda value: round(value * color[3] / 255)))
        overlay = Image.alpha_composite(overlay, tint)
    draw = ImageDraw.Draw(overlay)
    draw.line((0, TARGET_FOOT_Y, CANVAS[0], TARGET_FOOT_Y), fill=(255, 255, 255, 220), width=2)
    draw.line((TARGET_CENTER_X, 0, TARGET_CENTER_X, CANVAS[1]), fill=(255, 255, 255, 160), width=2)
    overlay.save(OUTPUT / "transition-overlay.png")


if __name__ == "__main__":
    main()
