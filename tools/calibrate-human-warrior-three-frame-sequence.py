from pathlib import Path
import json
import shutil

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "character-portraits" / "calibration-tests" / "human-warrior-three-frame-v1"
SOURCES = [
    ROOT / "assets" / "character-portraits" / f"human-warrior-idle-{index:02d}.png"
    for index in range(1, 4)
]

CANVAS = (1100, 1600)
TARGET_CENTER_X = 550
TARGET_FOOT_Y = 1540


def analyze(image):
    rgba = np.asarray(image.convert("RGBA"))
    alpha = rgba[:, :, 3]
    visible = alpha > 8
    stable = alpha > 32
    ys, xs = np.where(visible)
    bbox = [int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)]
    row_counts = stable.sum(axis=1)
    dense_top = next(
        y for y in range(image.height - 7)
        if np.count_nonzero(row_counts[y:y + 8] >= 80) >= 7
    )
    foot_y = int(np.where(row_counts > 10)[0].max())
    body_height = foot_y - dense_top + 1

    grid_y, grid_x = np.indices(stable.shape)
    torso_region = (
        stable
        & (grid_y >= dense_top + 0.28 * body_height)
        & (grid_y <= dense_top + 0.62 * body_height)
        & (grid_x >= image.width * 0.20)
        & (grid_x <= image.width * 0.80)
    )
    torso_y, torso_x = np.where(torso_region)
    weights = alpha[torso_y, torso_x].astype(float)
    order = np.argsort(torso_x)
    sorted_x = torso_x[order]
    cumulative = np.cumsum(weights[order])
    torso_center = float(sorted_x[np.searchsorted(cumulative, cumulative[-1] / 2)])
    return {
        "canvas": [image.width, image.height],
        "alpha_bbox": bbox,
        "alpha_width": bbox[2] - bbox[0],
        "alpha_height": bbox[3] - bbox[1],
        "visual_head_y": dense_top,
        "foot_y": foot_y,
        "visual_body_height": body_height,
        "torso_center_x": torso_center,
    }


def resize_premultiplied(image, size):
    rgba = np.asarray(image.convert("RGBA"), dtype=np.float32)
    alpha = rgba[:, :, 3:4] / 255.0
    premultiplied = np.concatenate((rgba[:, :, :3] * alpha, rgba[:, :, 3:4]), axis=2)
    resized = np.asarray(
        Image.fromarray(np.clip(premultiplied, 0, 255).astype(np.uint8), "RGBA").resize(
            size, Image.Resampling.LANCZOS
        ),
        dtype=np.float32,
    )
    out_alpha = resized[:, :, 3:4]
    rgb = np.divide(
        resized[:, :, :3] * 255.0,
        out_alpha,
        out=np.zeros_like(resized[:, :, :3]),
        where=out_alpha > 0,
    )
    return Image.fromarray(
        np.clip(np.concatenate((rgb, out_alpha), axis=2), 0, 255).astype(np.uint8), "RGBA"
    )


def checkerboard(size, cell=24):
    image = Image.new("RGBA", size, (29, 32, 43, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill=(39, 43, 57, 255))
    return image


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    originals = []
    for index, source in enumerate(SOURCES, 1):
        if not source.exists():
            raise FileNotFoundError(source)
        shutil.copy2(source, OUTPUT / f"source-{index:02d}.png")
        originals.append(Image.open(source).convert("RGBA"))

    metrics = [analyze(image) for image in originals]
    target_height = int(round(np.median([metric["visual_body_height"] for metric in metrics])))
    output_frames = []
    for index, (image, metric) in enumerate(zip(originals, metrics), 1):
        scale = target_height / metric["visual_body_height"]
        resized = resize_premultiplied(
            image,
            (round(image.width * scale), round(image.height * scale)),
        )
        paste_x = round(TARGET_CENTER_X - metric["torso_center_x"] * scale)
        paste_y = round(TARGET_FOOT_Y - metric["foot_y"] * scale)
        canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
        canvas.alpha_composite(resized, (paste_x, paste_y))
        canvas.save(OUTPUT / f"frame-{index:02d}.png", compress_level=6)
        output_frames.append(canvas)
        metric.update({
            "scale": round(scale, 6),
            "translation_x": paste_x,
            "translation_y": paste_y,
            "corrected_head_y": round(paste_y + metric["visual_head_y"] * scale, 2),
            "corrected_foot_y": round(paste_y + metric["foot_y"] * scale, 2),
            "corrected_torso_center_x": round(paste_x + metric["torso_center_x"] * scale, 2),
        })

    report = {
        "method": "Alpha analysis; dense silhouette head reference; shoe baseline and torso core alignment",
        "canvas": list(CANVAS),
        "target_foot_y": TARGET_FOOT_Y,
        "target_torso_center_x": TARGET_CENTER_X,
        "target_visual_body_height": target_height,
        "frames": metrics,
    }
    (OUTPUT / "analysis.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    thumb_size = (275, 400)
    contact = checkerboard((thumb_size[0] * 3, thumb_size[1]))
    for index, frame in enumerate(output_frames):
        contact.alpha_composite(frame.resize(thumb_size, Image.Resampling.LANCZOS), (index * thumb_size[0], 0))
    contact.save(OUTPUT / "contact-sheet.png")

    colors = [(255, 80, 80, 105), (80, 200, 255, 105), (130, 255, 120, 105)]
    overlay = Image.new("RGBA", CANVAS, (0, 0, 0, 255))
    for frame, color in zip(output_frames, colors):
        tint = Image.new("RGBA", CANVAS, color)
        tint.putalpha(frame.getchannel("A").point(lambda value: round(value * color[3] / 255)))
        overlay = Image.alpha_composite(overlay, tint)
    draw = ImageDraw.Draw(overlay)
    draw.line((0, TARGET_FOOT_Y, CANVAS[0], TARGET_FOOT_Y), fill=(255, 255, 255, 220), width=2)
    draw.line((TARGET_CENTER_X, 0, TARGET_CENTER_X, CANVAS[1]), fill=(255, 255, 255, 160), width=2)
    overlay.save(OUTPUT / "alignment-overlay.png")


if __name__ == "__main__":
    main()
