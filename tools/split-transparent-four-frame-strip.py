from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


def contiguous_runs(columns: np.ndarray) -> list[tuple[int, int]]:
    active = np.where(columns)[0]
    if not len(active):
        return []
    runs: list[tuple[int, int]] = []
    start = previous = int(active[0])
    for value in active[1:]:
        current = int(value)
        if current > previous + 1:
            runs.append((start, previous))
            start = current
        previous = current
    runs.append((start, previous))
    return runs


def bbox(mask: np.ndarray) -> tuple[int, int, int, int]:
    ys, xs = np.where(mask)
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


def find_partitions(alpha: np.ndarray, count: int = 4, threshold: int = 15) -> list[tuple[int, int]]:
    runs = contiguous_runs((alpha > threshold).any(axis=0))
    if len(runs) != count:
        raise ValueError(f"expected {count} visible horizontal runs, found {len(runs)}: {runs}")
    boundaries = [0]
    for left, right in zip(runs, runs[1:]):
        boundaries.append((left[1] + right[0]) // 2 + 1)
    boundaries.append(alpha.shape[1])
    return [(boundaries[index], boundaries[index + 1] - 1) for index in range(count)]


def torso_center(alpha: np.ndarray, stable_bbox: tuple[int, int, int, int]) -> float:
    left, top, right, bottom = stable_bbox
    width = right - left
    height = bottom - top
    roi_left = round(left + width * 0.22)
    roi_right = round(left + width * 0.78)
    roi_top = round(top + height * 0.24)
    roi_bottom = round(top + height * 0.66)
    core = alpha[roi_top:roi_bottom + 1, roi_left:roi_right + 1] > 127
    _, xs = np.where(core)
    if not len(xs):
        raise ValueError("could not locate opaque torso core")
    return float(xs.mean() + roi_left)


def analyze_frame(alpha: np.ndarray, start_x: int, end_x: int) -> dict[str, object]:
    segment = alpha[:, start_x:end_x + 1]
    visible = bbox(segment > 0)
    stable = bbox(segment > 15)
    center_x = torso_center(segment, stable)
    return {
        "partition": [start_x, end_x],
        "visible_bbox": list(visible),
        "stable_bbox": list(stable),
        "foot_y": stable[3],
        "torso_center_x": center_x,
        "source_edge_contact": {
            "left": start_x + visible[0] == 0,
            "right": start_x + visible[2] == alpha.shape[1] - 1,
            "top": visible[1] == 0,
            "bottom": visible[3] == alpha.shape[0] - 1,
        },
    }


def alpha_metrics(image: Image.Image) -> dict[str, float | int]:
    left, top, right, bottom = bbox(np.asarray(image.getchannel("A")) > 0)
    return {
        "left": left,
        "top": top,
        "right": right,
        "bottom": bottom,
        "width": right - left + 1,
        "height": bottom - top + 1,
        "center_x": round((left + right) / 2, 2),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Split a transparent horizontal four-frame strip without resampling pixels.")
    parser.add_argument("source", type=Path)
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()

    source = Image.open(args.source).convert("RGBA")
    alpha = np.asarray(source.getchannel("A"))
    partitions = find_partitions(alpha)
    frames = [analyze_frame(alpha, start, end) for start, end in partitions]

    safety_margin = 40
    max_width = max(frame["visible_bbox"][2] - frame["visible_bbox"][0] + 1 for frame in frames)
    max_height = max(frame["visible_bbox"][3] - frame["visible_bbox"][1] + 1 for frame in frames)
    canvas_size = (max_width + safety_margin * 2, max_height + safety_margin * 2)
    target_torso_x = canvas_size[0] // 2
    target_foot_y = canvas_size[1] - safety_margin

    args.output_dir.mkdir(parents=True, exist_ok=True)
    report: dict[str, object] = {
        "source": str(args.source),
        "source_canvas": {"width": source.width, "height": source.height},
        "output_canvas": {"width": canvas_size[0], "height": canvas_size[1]},
        "alpha_detection_threshold": 15,
        "safety_margin": safety_margin,
        "target_foot_y": target_foot_y,
        "target_torso_x": target_torso_x,
        "resampling": "none; source pixels copied exactly",
        "frames": [],
    }
    outputs: list[Image.Image] = []

    for index, frame in enumerate(frames, 1):
        start_x, _ = frame["partition"]
        left, top, right, bottom = frame["visible_bbox"]
        crop = source.crop((start_x + left, top, start_x + right + 1, bottom + 1))
        local_torso_x = frame["torso_center_x"] - left
        local_foot_y = frame["foot_y"] - top
        offset_x = round(target_torso_x - local_torso_x)
        offset_y = round(target_foot_y - local_foot_y)
        canvas = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
        canvas.alpha_composite(crop, (offset_x, offset_y))
        output_path = args.output_dir / f"frame-{index:02d}.png"
        canvas.save(output_path, optimize=True)
        outputs.append(canvas)
        report["frames"].append({
            "frame": index,
            "output": output_path.name,
            "source_partition": frame["partition"],
            "source_visible_bbox": frame["visible_bbox"],
            "source_stable_bbox": frame["stable_bbox"],
            "source_edge_contact": frame["source_edge_contact"],
            "output_offset": [offset_x, offset_y],
            "output_bbox": alpha_metrics(canvas),
            "foot_y": round(local_foot_y + offset_y, 2),
            "torso_center_x": round(local_torso_x + offset_x, 2),
        })

    thumb_width = 300
    thumb_height = round(thumb_width * canvas_size[1] / canvas_size[0])
    contact = Image.new("RGBA", (thumb_width * 4, thumb_height + 44), (8, 12, 24, 255))
    draw = ImageDraw.Draw(contact)
    for index, image in enumerate(outputs, 1):
        preview = image.resize((thumb_width, thumb_height), Image.Resampling.LANCZOS)
        contact.alpha_composite(preview, ((index - 1) * thumb_width, 0))
        draw.text(((index - 1) * thumb_width + 12, thumb_height + 12), f"Frame {index}", fill=(235, 240, 255, 255))
    contact.save(args.output_dir / "contact-sheet.png", optimize=True)
    (args.output_dir / "split-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
