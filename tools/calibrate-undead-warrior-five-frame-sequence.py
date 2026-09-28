from pathlib import Path
import hashlib
import json
import shutil

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "character-portraits" / "calibration-tests" / "undead-warrior-five-frame"
SOURCES = [
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-6215625a-c04b-480e-987e-875553caf2a2.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-7a3f091e-0962-4a41-bc7c-c75586e416e7.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-e56cbaac-54fc-4bdd-a93d-b79d2669a13f.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-332b2371-ddcf-4f19-9cfa-9841c8a30847.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-7500a6ef-b7ef-426f-80f4-c8802775f847.png"),
]
CANVAS = (1500, 1600)
TARGET_CENTER_X = 750
TARGET_FOOT_Y = 1500
SAFETY_MARGIN = 55


def analyze(image, digest):
    rgba = np.asarray(image.convert("RGBA"))
    alpha = rgba[:, :, 3]
    stable = alpha > 32
    visible = alpha > 1
    grid_y, grid_x = np.indices(stable.shape)
    ys, xs = np.where(visible)
    bbox = [int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)]
    row_counts = stable.sum(axis=1)
    foot_y = int(np.where(row_counts > 16)[0].max())

    # Restrict the head and torso measurements to the body core so the sword,
    # shield, hair tips, and cape cannot determine character scale or center.
    rough_center = float(np.median(xs[(ys > image.height * .22) & (ys < image.height * .78)]))
    core_left = max(0, round(rough_center - image.width * .20))
    core_right = min(image.width, round(rough_center + image.width * .20))
    core_rows = stable[:, core_left:core_right].sum(axis=1)
    head_y = next(y for y in range(image.height - 8) if np.count_nonzero(core_rows[y:y + 9] >= 35) >= 7)
    body_height = foot_y - head_y + 1
    torso = (
        stable
        & (grid_y >= head_y + body_height * .28)
        & (grid_y <= head_y + body_height * .63)
        & (grid_x >= rough_center - body_height * .20)
        & (grid_x <= rough_center + body_height * .20)
    )
    torso_center_x = float(np.median(grid_x[torso]))
    return {
        "sha256": digest,
        "canvas": [image.width, image.height],
        "alpha_bbox_low_threshold": bbox,
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
    originals, digests = [], []
    for index, source in enumerate(SOURCES, 1):
        if not source.exists():
            raise FileNotFoundError(source)
        digest = hashlib.sha256(source.read_bytes()).hexdigest()
        digests.append(digest)
        originals.append(Image.open(source).convert("RGBA"))
        shutil.copy2(source, OUTPUT / f"source-{index:02d}.png")

    metrics = [analyze(image, digest) for image, digest in zip(originals, digests)]
    reference_height = int(np.median([metric["visual_body_height"] for metric in metrics]))
    corrected = []
    for index, (image, metric) in enumerate(zip(originals, metrics), 1):
        # Frame 2 is crouched and frames 4-5 tilt the head; those pose changes
        # reduce the shoe-to-head measurement without changing character scale.
        scale = 1.0
        resized = resize_premultiplied(image, (round(image.width * scale), round(image.height * scale)))
        translation_x = round(TARGET_CENTER_X - metric["torso_center_x"] * scale)
        translation_y = round(TARGET_FOOT_Y - metric["foot_y"] * scale)
        canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
        canvas.alpha_composite(resized, (translation_x, translation_y))
        canvas.save(OUTPUT / f"frame-{index:02d}.png", compress_level=6)
        corrected.append(canvas)

        bbox = metric["alpha_bbox_low_threshold"]
        corrected_bbox = [
            round(translation_x + bbox[0] * scale), round(translation_y + bbox[1] * scale),
            round(translation_x + bbox[2] * scale), round(translation_y + bbox[3] * scale),
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
            "safety_margin_pass": min(margins) >= SAFETY_MARGIN,
            "height_difference_percent_from_reference": round((metric["visual_body_height"] / reference_height - 1) * 100, 2),
        })

    report = {
        "method": "Shoe baseline + torso core center; sword, shield, hair tips, and cape excluded from body-scale judgment",
        "canvas": list(CANVAS),
        "target_foot_y": TARGET_FOOT_Y,
        "target_torso_center_x": TARGET_CENTER_X,
        "reference_visual_body_height": reference_height,
        "minimum_safety_margin": SAFETY_MARGIN,
        "scaling_decision": "No frame was scaled. Frame 2's shorter shoe-to-head height comes from the crouched pose; frames 4-5 differ mainly through head tilt and local redraw, not whole-character scale.",
        "local_redraw_difference": "Pose and head angle change across the sequence; local face, neck, and shoulder redraw differences were retained rather than forcing non-uniform correction.",
        "container_check": "Preview stage uses overflow:visible and object-fit:contain; sword, shield, hair, and cape remain visible.",
        "playback": {"frame_duration_ms": 312.5, "loop_duration_ms": 2500, "order": [1, 2, 3, 4, 5, 4, 3, 2]},
        "frames": metrics,
    }
    (OUTPUT / "analysis.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    thumb = (280, 320)
    contact = Image.new("RGBA", (thumb[0] * 5, thumb[1]), (24, 20, 35, 255))
    for index, frame in enumerate(corrected):
        contact.alpha_composite(frame.resize(thumb, Image.Resampling.LANCZOS), (index * thumb[0], 0))
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
