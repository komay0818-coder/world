from pathlib import Path
from collections import deque
import hashlib
import json
import shutil

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "character-portraits" / "calibration-tests" / "orc-hunter-five-frame"
SOURCES = [
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-c3d96f4a-677e-48f5-b39d-0d3710b4dc69.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-52b4fcb9-381e-4c22-b434-ef66ddd5d6ba.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-d1cea064-8e12-4a78-9b0a-49a9cf869bc7.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-a1e4a6cc-edc1-47dc-be17-17296663a276.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-4bb71dab-3e53-4822-8cd4-21def50b4bc6.png"),
]
CANVAS = (1500, 1600)
TARGET_CENTER_X = 650
TARGET_FOOT_Y = 1500
SAFETY_MARGIN = 70
REFERENCE_BODY_HEIGHT = 1358


def repair_fourth_alpha(images):
    reference = np.asarray(images[4], dtype=np.float32)
    target = np.asarray(images[3], dtype=np.float32)
    rgb_max = target[:, :, :3].max(axis=2)
    rgb_min = target[:, :, :3].min(axis=2)
    saturation = np.divide(rgb_max - rgb_min, np.maximum(rgb_max, 1))
    candidate = saturation < 0.10
    height, width = candidate.shape
    background = np.zeros(candidate.shape, dtype=bool)
    queue = deque()
    for x in range(width):
        if candidate[0, x]: queue.append((0, x))
        if candidate[height - 1, x]: queue.append((height - 1, x))
    for y in range(height):
        if candidate[y, 0]: queue.append((y, 0))
        if candidate[y, width - 1]: queue.append((y, width - 1))
    while queue:
        y, x = queue.popleft()
        if background[y, x] or not candidate[y, x]:
            continue
        background[y, x] = True
        if y: queue.append((y - 1, x))
        if y + 1 < height: queue.append((y + 1, x))
        if x: queue.append((y, x - 1))
        if x + 1 < width: queue.append((y, x + 1))
    color_distance = np.sqrt(np.mean((target[:, :, :3] - reference[:, :, :3]) ** 2, axis=2))
    visited = background.copy()
    for start_y, start_x in zip(*np.where(candidate & ~visited)):
        if visited[start_y, start_x]:
            continue
        component = []
        queue.append((int(start_y), int(start_x)))
        while queue:
            y, x = queue.popleft()
            if visited[y, x] or not candidate[y, x]:
                continue
            visited[y, x] = True
            component.append((y, x))
            if y: queue.append((y - 1, x))
            if y + 1 < height: queue.append((y + 1, x))
            if x: queue.append((y, x - 1))
            if x + 1 < width: queue.append((y, x + 1))
        if len(component) > 500:
            cy, cx = zip(*component)
            if float(np.median(color_distance[cy, cx])) >= 45:
                background[cy, cx] = True
    alpha = Image.fromarray((~background * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.55))
    repaired = np.dstack((target[:, :, :3].astype(np.uint8), np.asarray(alpha, dtype=np.uint8)))
    return Image.fromarray(repaired, "RGBA")


def analyze(image, digest):
    rgba = np.asarray(image.convert("RGBA"))
    alpha = rgba[:, :, 3]
    stable = alpha > 32
    visible = alpha > 1
    grid_y, grid_x = np.indices(stable.shape)
    ys, xs = np.where(visible)
    bbox = [int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)]
    foot_y = int(np.where(stable.sum(axis=1) > 20)[0].max())

    green_skin = (
        stable
        & (rgba[:, :, 0] > rgba[:, :, 2] * 1.15)
        & (rgba[:, :, 1] > rgba[:, :, 2] * 1.10)
        & (grid_y > image.height * 0.12)
        & (grid_y < image.height * 0.72)
        & (grid_x > image.width * 0.18)
        & (grid_x < image.width * 0.78)
    )
    torso_center_x = float(np.median(grid_x[green_skin]))
    left = max(0, round(torso_center_x - 170))
    right = min(image.width, round(torso_center_x + 170))
    core_rows = stable[:, left:right].sum(axis=1)
    head_y = next(y for y in range(image.height - 8) if np.count_nonzero(core_rows[y:y + 9] >= 40) >= 8)
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
    digests = []
    for source in SOURCES:
        if not source.exists():
            raise FileNotFoundError(source)
        digests.append(hashlib.sha256(source.read_bytes()).hexdigest())
        originals.append(Image.open(source).convert("RGBA"))

    originals[3] = repair_fourth_alpha(originals)
    for index, (source, image) in enumerate(zip(SOURCES, originals), 1):
        destination = OUTPUT / f"source-{index:02d}.png"
        if index == 4:
            image.save(destination, "PNG", optimize=True)
        else:
            shutil.copy2(source, destination)

    metrics = [analyze(image, digest) for image, digest in zip(originals, digests)]
    corrected = []
    for index, (image, metric) in enumerate(zip(originals, metrics), 1):
        scale = REFERENCE_BODY_HEIGHT / metric["visual_body_height"] if index == 3 else 1.0
        resized = resize_premultiplied(image, (round(image.width * scale), round(image.height * scale)))
        translation_x = round(TARGET_CENTER_X - metric["torso_center_x"] * scale)
        translation_y = round(TARGET_FOOT_Y - metric["foot_y"] * scale)
        canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
        canvas.alpha_composite(resized, (translation_x, translation_y))
        frame_path = OUTPUT / ("frame-03-replacement.png" if index == 3 else f"frame-{index:02d}.png")
        if index == 3 or not frame_path.exists():
            canvas.save(frame_path, compress_level=6)
        else:
            canvas = Image.open(frame_path).convert("RGBA")
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
            "effect_safety_margin_pass": min(margins) >= SAFETY_MARGIN,
        })

    heights = [frame["visual_body_height"] for frame in metrics]
    median_height = float(np.median(heights))
    for metric in metrics:
        metric["height_difference_percent_from_median"] = round((metric["visual_body_height"] / median_height - 1) * 100, 2)

    report = {
        "method": "Shoe baseline + green-skin torso center; bow, arrows, hair, fur, and arms excluded from center judgment",
        "canvas": list(CANVAS),
        "target_foot_y": TARGET_FOOT_Y,
        "target_torso_center_x": TARGET_CENTER_X,
        "minimum_safety_margin": SAFETY_MARGIN,
        "scaling_decision": "Replacement frame 3 scaled uniformly to the stable 1358 px body-height reference; frames 1, 2, 4, and 5 remain at 1.0",
        "alpha_repair": "Frame 4 contained an opaque checkerboard; its alpha was restored using connected-background detection with the same-size frame 5 as a contamination reference",
        "local_redraw_difference": "Minor AI redraw differences remain in face angle and jaw expression across frames 1-5; body proportions are consistent enough for a translation-only first test",
        "container_check": "Preview stage uses overflow:visible and object-fit:contain, so bow and hair are not clipped",
        "playback": {"frame_duration_ms": 312.5, "loop_duration_ms": 2500, "order": [1, 2, 3, 4, 5, 4, 3, 2]},
        "frames": metrics,
    }
    (OUTPUT / "analysis.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    thumb_size = (285, 304)
    contact = Image.new("RGBA", (1425, 304), (24, 29, 43, 255))
    for index, frame in enumerate(corrected):
        contact.alpha_composite(frame.resize(thumb_size, Image.Resampling.LANCZOS), (index * thumb_size[0], 0))
    contact.save(OUTPUT / "contact-sheet-v2.png")

    colors = [(255, 80, 80, 78), (80, 200, 255, 78), (130, 255, 120, 78), (255, 210, 80, 78), (220, 110, 255, 78)]
    overlay = Image.new("RGBA", CANVAS, (0, 0, 0, 255))
    for frame, color in zip(corrected, colors):
        tint = Image.new("RGBA", CANVAS, color)
        tint.putalpha(frame.getchannel("A").point(lambda value: round(value * color[3] / 255)))
        overlay = Image.alpha_composite(overlay, tint)
    draw = ImageDraw.Draw(overlay)
    draw.line((0, TARGET_FOOT_Y, CANVAS[0], TARGET_FOOT_Y), fill=(255, 255, 255, 220), width=2)
    draw.line((TARGET_CENTER_X, 0, TARGET_CENTER_X, CANVAS[1]), fill=(255, 255, 255, 160), width=2)
    overlay.save(OUTPUT / "alignment-overlay-v2.png")


if __name__ == "__main__":
    main()
