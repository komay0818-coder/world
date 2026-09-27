from pathlib import Path
import hashlib
import json
import shutil

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "character-portraits" / "calibration-tests" / "orc-warrior-three-frame-v1"
SOURCES = [
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-24b69f58-ce93-4b71-88dc-120fbc3338f6.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-1bece500-b9a8-4326-87a4-3e90f8c640d1.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-9063f79f-7215-46e6-acbf-a8b3337f64f8.png"),
]
CANVAS = (1300, 1600)
TARGET_CENTER_X = 650
TARGET_FOOT_Y = 1530


def analyze(image, digest):
    rgba = np.asarray(image.convert("RGBA"))
    alpha = rgba[:, :, 3]
    stable = alpha > 32
    visible = alpha > 8
    grid_y, grid_x = np.indices(stable.shape)
    ys, xs = np.where(visible)
    bbox = [int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)]
    row_counts = stable.sum(axis=1)
    foot_y = int(np.where(row_counts > 10)[0].max())

    # The belt ornament is stable across these poses and excludes the axe,
    # shield, arms, and asymmetric hair from the horizontal anchor.
    belt = (
        stable
        & (rgba[:, :, 0] > 170)
        & (rgba[:, :, 1] > 110)
        & (rgba[:, :, 1] < 220)
        & (rgba[:, :, 2] < 140)
        & (grid_y > image.height * 0.38)
        & (grid_y < image.height * 0.62)
        & (grid_x > image.width * 0.30)
        & (grid_x < image.width * 0.70)
    )
    torso_center_x = float(np.median(grid_x[belt]))

    # Isolate the brown mohawk near the body core; the axe head is excluded.
    hair = (
        stable
        & (rgba[:, :, 0] > 45)
        & (rgba[:, :, 0] < 145)
        & (rgba[:, :, 1] < 95)
        & (rgba[:, :, 2] < 85)
        & (rgba[:, :, 0] > rgba[:, :, 1] * 1.25)
        & (grid_x > image.width * 0.40)
        & (grid_x < image.width * 0.62)
        & (grid_y > 70)
        & (grid_y < 450)
    )
    head_y = int(np.where(hair)[0].min())
    return {
        "sha256": digest,
        "canvas": [image.width, image.height],
        "alpha_bbox": bbox,
        "visual_head_y": head_y,
        "foot_y": foot_y,
        "visual_body_height": foot_y - head_y + 1,
        "torso_center_x": torso_center_x,
    }


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
        scale = 1.0
        translation_x = round(TARGET_CENTER_X - metric["torso_center_x"])
        translation_y = round(TARGET_FOOT_Y - metric["foot_y"])
        canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
        canvas.alpha_composite(image, (translation_x, translation_y))
        canvas.save(OUTPUT / f"frame-{index:02d}.png", compress_level=6)
        corrected.append(canvas)
        metric.update({
            "scale": scale,
            "translation_x": translation_x,
            "translation_y": translation_y,
            "corrected_visual_body_height": metric["visual_body_height"],
            "corrected_head_y": metric["visual_head_y"] + translation_y,
            "corrected_foot_y": metric["foot_y"] + translation_y,
            "corrected_torso_center_x": metric["torso_center_x"] + translation_x,
        })

    reference_height = int(np.median([item["visual_body_height"] for item in metrics]))
    for metric in metrics:
        metric["height_difference_percent"] = round(
            (metric["visual_body_height"] / reference_height - 1) * 100, 2
        )

    report = {
        "method": "Shoe baseline + belt/torso center; axe, shield, arms, and hair excluded from center",
        "canvas": list(CANVAS),
        "reference_visual_body_height": reference_height,
        "target_foot_y": TARGET_FOOT_Y,
        "target_torso_center_x": TARGET_CENTER_X,
        "scaling_decision": "No scaling; the small height difference follows pose/head redraw rather than global size",
        "playback": {"frame_duration_ms": 325, "order": [1, 2, 3, 2]},
        "frames": metrics,
    }
    (OUTPUT / "analysis.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    thumb_size = (260, 320)
    contact = Image.new("RGBA", (780, 320), (24, 29, 43, 255))
    for index, frame in enumerate(corrected):
        contact.alpha_composite(frame.resize(thumb_size, Image.Resampling.LANCZOS), (index * 260, 0))
    contact.save(OUTPUT / "contact-sheet.png")

    colors = [(255, 80, 80, 90), (80, 200, 255, 90), (130, 255, 120, 90)]
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
