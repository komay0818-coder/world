from pathlib import Path
import hashlib
import json
import shutil

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "character-portraits" / "calibration-tests" / "human-priest-five-frame-v1"
SOURCES = [
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-f97121a0-7668-4753-bee0-70cdd74885c1.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-3d2629cf-9c88-4f50-a0bd-1f2e521ee721.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-33b1a5d1-e37f-4ff1-adde-659894cc7181.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-f7a08e6b-dffd-4a73-aa41-347d54a20efa.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-936cb03d-1ed6-4c2b-a0c1-f1a98fe05e47.png"),
]
CANVAS = (1200, 1800)
TARGET_BODY_HEIGHT = 1354
TARGET_CENTER_X = 600
TARGET_FOOT_Y = 1740


def analyze(image, digest):
    rgba = np.asarray(image.convert("RGBA"))
    alpha = rgba[:, :, 3]
    visible = alpha > 8
    stable = alpha > 32
    ys, xs = np.where(visible)
    bbox = [int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)]
    row_counts = stable.sum(axis=1)
    foot_y = int(np.where(row_counts > 10)[0].max())

    grid_y, grid_x = np.indices(stable.shape)
    rough_top = next(y for y in range(image.height - 7) if np.count_nonzero(row_counts[y:y + 8] >= 80) >= 7)
    rough_height = foot_y - rough_top + 1
    lower = stable & (grid_y >= foot_y - 0.30 * rough_height)
    lower_x = grid_x[lower]
    lo, hi = np.quantile(lower_x, [0.08, 0.92])
    foot_center = float(np.median(lower_x[(lower_x >= lo) & (lower_x <= hi)]))
    torso_region = (
        stable
        & (grid_y >= rough_top + 0.30 * rough_height)
        & (grid_y <= rough_top + 0.62 * rough_height)
        & (grid_x >= foot_center - 0.24 * rough_height)
        & (grid_x <= foot_center + 0.24 * rough_height)
    )
    torso_y, torso_x = np.where(torso_region)
    weights = alpha[torso_y, torso_x].astype(float)
    order = np.argsort(torso_x)
    sorted_x = torso_x[order]
    cumulative = np.cumsum(weights[order])
    torso_center_x = float(sorted_x[np.searchsorted(cumulative, cumulative[-1] / 2)])

    core_rows = stable[:, max(0, round(torso_center_x - 180)):min(image.width, round(torso_center_x + 180))].sum(axis=1)
    head_y = next(y for y in range(image.height - 7) if np.count_nonzero(core_rows[y:y + 8] >= 50) >= 7)
    body_height = foot_y - head_y + 1
    return {
        "sha256": digest,
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
    OUTPUT.mkdir(parents=True, exist_ok=True)
    originals = []
    metrics = []
    for index, source in enumerate(SOURCES, 1):
        if not source.exists():
            raise FileNotFoundError(source)
        data = source.read_bytes()
        shutil.copy2(source, OUTPUT / f"source-{index:02d}.png")
        image = Image.open(source).convert("RGBA")
        originals.append(image)
        metrics.append(analyze(image, hashlib.sha256(data).hexdigest()))

    corrected = []
    for index, (image, metric) in enumerate(zip(originals, metrics), 1):
        scale = TARGET_BODY_HEIGHT / metric["visual_body_height"] if index <= 2 else 1.0
        resized = resize_premultiplied(image, (round(image.width * scale), round(image.height * scale)))
        translation_x = round(TARGET_CENTER_X - metric["torso_center_x"] * scale)
        translation_y = round(TARGET_FOOT_Y - metric["foot_y"] * scale)
        canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
        canvas.alpha_composite(resized, (translation_x, translation_y))
        canvas.save(OUTPUT / f"frame-{index:02d}.png", compress_level=6)
        corrected.append(canvas)
        metric.update({
            "scale": round(scale, 6),
            "translation_x": translation_x,
            "translation_y": translation_y,
            "corrected_visual_body_height": round(metric["visual_body_height"] * scale, 2),
            "corrected_head_y": round(translation_y + metric["visual_head_y"] * scale, 2),
            "corrected_foot_y": round(translation_y + metric["foot_y"] * scale, 2),
            "corrected_torso_center_x": round(translation_x + metric["torso_center_x"] * scale, 2),
        })

    report = {
        "method": "Core head-to-shoe height; weapon excluded; shoe baseline and torso center alignment",
        "canvas": list(CANVAS),
        "target_visual_body_height": TARGET_BODY_HEIGHT,
        "target_foot_y": TARGET_FOOT_Y,
        "target_torso_center_x": TARGET_CENTER_X,
        "duplicate_frames": [[1, 2]],
        "playback": {"frame_duration_ms": 180, "order": [1, 2, 3, 4, 5, 4, 3, 2]},
        "frames": metrics,
    }
    (OUTPUT / "analysis.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    thumb_size = (240, 360)
    contact = Image.new("RGBA", (1200, 360), (24, 29, 43, 255))
    for index, frame in enumerate(corrected):
        contact.alpha_composite(frame.resize(thumb_size, Image.Resampling.LANCZOS), (index * 240, 0))
    contact.save(OUTPUT / "contact-sheet.png")

    colors = [(255, 80, 80, 95), (80, 200, 255, 95), (130, 255, 120, 95), (255, 210, 80, 95), (220, 110, 255, 95)]
    overlay = Image.new("RGBA", CANVAS, (0, 0, 0, 255))
    for frame, color in zip(corrected, colors):
        tint = Image.new("RGBA", CANVAS, color)
        tint.putalpha(frame.getchannel("A").point(lambda value: round(value * color[3] / 255)))
        overlay = Image.alpha_composite(overlay, tint)
    draw = ImageDraw.Draw(overlay)
    draw.line((0, TARGET_FOOT_Y, CANVAS[0], TARGET_FOOT_Y), fill=(255, 255, 255, 220), width=2)
    draw.line((TARGET_CENTER_X, 0, TARGET_CENTER_X, CANVAS[1]), fill=(255, 255, 255, 160), width=2)
    overlay.save(OUTPUT / "alignment-overlay.png")


if __name__ == "__main__":
    main()
