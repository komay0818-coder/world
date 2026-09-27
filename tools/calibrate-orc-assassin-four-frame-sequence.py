from pathlib import Path
import hashlib
import json
import shutil

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "character-portraits" / "calibration-tests" / "orc-assassin-four-frame-v1"
SOURCES = [
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-d4f6a022-9b6b-4f7a-97b6-bdd92f2add71.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-af7ca4c8-741f-40a0-8202-d0e8187791b5.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-04ade5cf-82e7-4cf9-bcc5-da096db5ba74.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-a14be365-46b6-4e8a-ab25-6c1a0435223e.png"),
]
CANVAS = (1400, 1550)
TARGET_BODY_HEIGHT = 1268
TARGET_CENTER_X = 700
TARGET_FOOT_Y = 1490


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

    belt = (
        stable
        & (rgba[:, :, 0] > 160)
        & (rgba[:, :, 1] > 100)
        & (rgba[:, :, 1] < 230)
        & (rgba[:, :, 2] < 170)
        & (grid_y > image.height * 0.40)
        & (grid_y < image.height * 0.58)
        & (grid_x > image.width * 0.42)
        & (grid_x < image.width * 0.72)
    )
    torso_center_x = float(np.median(grid_x[belt]))

    hair = (
        stable
        & (rgba[:, :, 0] > 45)
        & (rgba[:, :, 0] < 150)
        & (rgba[:, :, 1] < 100)
        & (rgba[:, :, 2] < 95)
        & (rgba[:, :, 0] > rgba[:, :, 1] * 1.18)
        & (grid_x > image.width * 0.48)
        & (grid_x < image.width * 0.75)
        & (grid_y > 20)
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
        metric.update({
            "scale": round(scale, 6),
            "translation_x": translation_x,
            "translation_y": translation_y,
            "corrected_visual_body_height": round(metric["visual_body_height"] * scale, 2),
            "corrected_head_y": round(metric["visual_head_y"] * scale + translation_y, 2),
            "corrected_foot_y": round(metric["foot_y"] * scale + translation_y, 2),
            "corrected_torso_center_x": round(metric["torso_center_x"] * scale + translation_x, 2),
            "height_difference_percent": round((metric["visual_body_height"] / TARGET_BODY_HEIGHT - 1) * 100, 2),
        })

    report = {
        "method": "Shoe baseline + belt/torso center; arms, cape, hair, and daggers excluded from center",
        "canvas": list(CANVAS),
        "target_visual_body_height": TARGET_BODY_HEIGHT,
        "target_foot_y": TARGET_FOOT_Y,
        "target_torso_center_x": TARGET_CENTER_X,
        "scaling_decision": "Frame 1 scaled up slightly; frames 2-4 keep original size because remaining differences are pose/redraw variation",
        "playback": {"frame_duration_ms": 1000 / 3, "order": [1, 2, 3, 4, 3, 2]},
        "frames": metrics,
    }
    (OUTPUT / "analysis.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    thumb_size = (280, 310)
    contact = Image.new("RGBA", (1120, 310), (24, 29, 43, 255))
    for index, frame in enumerate(corrected):
        contact.alpha_composite(frame.resize(thumb_size, Image.Resampling.LANCZOS), (index * 280, 0))
    contact.save(OUTPUT / "contact-sheet.png")

    colors = [(255, 80, 80, 85), (80, 200, 255, 85), (130, 255, 120, 85), (255, 210, 80, 85)]
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
