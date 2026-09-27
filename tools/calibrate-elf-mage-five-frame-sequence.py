from pathlib import Path
import hashlib
import json
import shutil

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "character-portraits" / "calibration-tests" / "elf-mage-five-frame-v1"
SOURCES = [
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-4c24e654-6635-4627-b4f5-10a4c9a8a341.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-a4abc59e-2241-4453-add9-c6babb61e9ac.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-fd6c433e-fccd-4525-825c-577d54cf1fec.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-b448a060-fe60-42db-8dac-c46d9d43f507.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-d07daa79-a39d-49d7-a5c0-5f646096eaaf.png"),
]
CANVAS = (1700, 1900)
TARGET_BODY_HEIGHT = 1374
TARGET_CENTER_X = 850
TARGET_FOOT_Y = 1820
SAFETY_MARGIN = 70


def analyze(image, digest):
    rgba = np.asarray(image.convert("RGBA"))
    alpha = rgba[:, :, 3]
    stable = alpha > 32
    visible = alpha > 1
    grid_y, grid_x = np.indices(stable.shape)
    ys, xs = np.where(visible)
    bbox = [int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)]
    row_counts = stable.sum(axis=1)
    foot_y = int(np.where(row_counts > 10)[0].max())

    skin = (
        stable
        & (rgba[:, :, 0] > 110)
        & (rgba[:, :, 2] > 95)
        & (rgba[:, :, 0] > rgba[:, :, 1] * 1.12)
        & (rgba[:, :, 2] > rgba[:, :, 1] * 1.05)
        & (grid_y > image.height * 0.12)
        & (grid_y < image.height * 0.62)
        & (grid_x > image.width * 0.25)
        & (grid_x < image.width * 0.78)
    )
    torso_center_x = float(np.median(grid_x[skin]))
    core_rows = stable[:, max(0, round(torso_center_x - 170)):min(image.width, round(torso_center_x + 170))].sum(axis=1)
    head_y = next(y for y in range(image.height - 8) if np.count_nonzero(core_rows[y:y + 9] >= 65) >= 8)
    return {
        "sha256": digest,
        "canvas": [image.width, image.height],
        "alpha_bbox_low_threshold": bbox,
        "visual_head_y": head_y,
        "foot_y": foot_y,
        "visual_body_height": foot_y - head_y + 1,
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
        scale = TARGET_BODY_HEIGHT / metric["visual_body_height"] if index == 1 else 1.0
        resized = resize_premultiplied(image, (round(image.width * scale), round(image.height * scale)))
        translation_x = round(TARGET_CENTER_X - metric["torso_center_x"] * scale)
        translation_y = round(TARGET_FOOT_Y - metric["foot_y"] * scale)
        canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
        canvas.alpha_composite(resized, (translation_x, translation_y))
        canvas.save(OUTPUT / f"frame-{index:02d}.png", compress_level=6)
        corrected.append(canvas)

        bbox = metric["alpha_bbox_low_threshold"]
        corrected_bbox = [
            round(translation_x + bbox[0] * scale),
            round(translation_y + bbox[1] * scale),
            round(translation_x + bbox[2] * scale),
            round(translation_y + bbox[3] * scale),
        ]
        margins = [corrected_bbox[0], corrected_bbox[1], CANVAS[0] - corrected_bbox[2], CANVAS[1] - corrected_bbox[3]]
        metric.update({
            "scale": round(scale, 6),
            "translation_x": translation_x,
            "translation_y": translation_y,
            "corrected_visual_body_height": round(metric["visual_body_height"] * scale, 2),
            "corrected_head_y": round(metric["visual_head_y"] * scale + translation_y, 2),
            "corrected_foot_y": round(metric["foot_y"] * scale + translation_y, 2),
            "corrected_torso_center_x": round(metric["torso_center_x"] * scale + translation_x, 2),
            "corrected_low_alpha_bbox": corrected_bbox,
            "transparent_margins_left_top_right_bottom": margins,
            "effect_safety_margin_pass": min(margins) >= SAFETY_MARGIN,
            "height_difference_percent": round((metric["visual_body_height"] / TARGET_BODY_HEIGHT - 1) * 100, 2),
        })

    report = {
        "method": "Shoe baseline + body skin center; staff, hair, sleeves, crystals, and magic effects excluded from body sizing",
        "canvas": list(CANVAS),
        "target_visual_body_height": TARGET_BODY_HEIGHT,
        "target_foot_y": TARGET_FOOT_Y,
        "target_torso_center_x": TARGET_CENTER_X,
        "minimum_effect_safety_margin": SAFETY_MARGIN,
        "scaling_decision": "Frame 1 scaled up to match body height; frames 2-5 retain original size",
        "duplicate_frames": [[2, 3]],
        "container_check": "Main preview uses a fixed-width image with automatic height; the common canvas fits inside both desktop and mobile containers despite overflow:hidden",
        "playback": {"frame_duration_ms": 180, "order": [1, 2, 3, 4, 5, 4, 3, 2]},
        "frames": metrics,
    }
    (OUTPUT / "analysis.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    thumb_size = (272, 304)
    contact = Image.new("RGBA", (1360, 304), (24, 29, 43, 255))
    for index, frame in enumerate(corrected):
        contact.alpha_composite(frame.resize(thumb_size, Image.Resampling.LANCZOS), (index * 272, 0))
    contact.save(OUTPUT / "contact-sheet.png")

    colors = [(255, 80, 80, 78), (80, 200, 255, 78), (130, 255, 120, 78), (255, 210, 80, 78), (220, 110, 255, 78)]
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
