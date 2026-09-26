from __future__ import annotations

import argparse
import json
from collections import deque
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


def connected_components(mask: np.ndarray, minimum_pixels: int = 20) -> list[tuple[int, np.ndarray]]:
    height, width = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    components: list[tuple[int, np.ndarray]] = []
    for y in range(height):
        for x in range(width):
            if not mask[y, x] or seen[y, x]:
                continue
            queue = deque([(y, x)])
            seen[y, x] = True
            pixels: list[tuple[int, int]] = []
            while queue:
                current_y, current_x = queue.popleft()
                pixels.append((current_y, current_x))
                for next_y, next_x in (
                    (current_y - 1, current_x),
                    (current_y + 1, current_x),
                    (current_y, current_x - 1),
                    (current_y, current_x + 1),
                ):
                    if 0 <= next_y < height and 0 <= next_x < width and mask[next_y, next_x] and not seen[next_y, next_x]:
                        seen[next_y, next_x] = True
                        queue.append((next_y, next_x))
            if len(pixels) >= minimum_pixels:
                component = np.zeros_like(mask, dtype=bool)
                ys, xs = zip(*pixels)
                component[np.asarray(ys), np.asarray(xs)] = True
                components.append((len(pixels), component))
    return components


def segment_frames(alpha: np.ndarray, count: int = 4, threshold: int = 15) -> list[tuple[np.ndarray, np.ndarray]]:
    components = sorted(connected_components(alpha > threshold), key=lambda item: item[0], reverse=True)[:count]
    if len(components) != count:
        raise ValueError(f"expected {count} large Alpha components, found {len(components)}")
    components.sort(key=lambda item: bbox(item[1])[0])

    labels = np.zeros(alpha.shape, dtype=np.int16)
    for label, (_, component) in enumerate(components, 1):
        labels[component] = label

    # Grow each stable component through the Alpha 1-15 antialias fringe. A
    # synchronous expansion behaves like a small watershed where poses overlap
    # in X but remain distinct in two dimensions.
    visible = alpha > 0
    for _ in range(64):
        unassigned = visible & (labels == 0)
        if not unassigned.any():
            break
        expanded = labels.copy()
        for shifted in (
            np.pad(labels[:-1], ((1, 0), (0, 0))),
            np.pad(labels[1:], ((0, 1), (0, 0))),
            np.pad(labels[:, :-1], ((0, 0), (1, 0))),
            np.pad(labels[:, 1:], ((0, 0), (0, 1))),
        ):
            take = unassigned & (expanded == 0) & (shifted > 0)
            expanded[take] = shifted[take]
        if np.array_equal(expanded, labels):
            break
        labels = expanded

    # Preserve isolated low-Alpha specks by assigning them to the nearest pose
    # horizontally instead of deleting source pixels.
    remaining_y, remaining_x = np.where(visible & (labels == 0))
    centers = np.asarray([(bbox(component)[0] + bbox(component)[2]) / 2 for _, component in components])
    for y, x in zip(remaining_y, remaining_x):
        labels[y, x] = int(np.argmin(np.abs(centers - x))) + 1

    return [(labels == label, component) for label, (_, component) in enumerate(components, 1)]


def torso_center(alpha: np.ndarray, visible_mask: np.ndarray, stable_bbox: tuple[int, int, int, int]) -> float:
    left, top, right, bottom = stable_bbox
    width = right - left
    height = bottom - top
    roi_left = round(left + width * 0.22)
    roi_right = round(left + width * 0.78)
    roi_top = round(top + height * 0.24)
    roi_bottom = round(top + height * 0.66)
    core = (alpha[roi_top:roi_bottom + 1, roi_left:roi_right + 1] > 127) & visible_mask[roi_top:roi_bottom + 1, roi_left:roi_right + 1]
    _, xs = np.where(core)
    if not len(xs):
        raise ValueError("could not locate opaque torso core")
    return float(xs.mean() + roi_left)


def analyze_frame(alpha: np.ndarray, visible_mask: np.ndarray, stable_mask: np.ndarray) -> dict[str, object]:
    visible = bbox(visible_mask)
    stable = bbox(stable_mask)
    center_x = torso_center(alpha, visible_mask, stable)
    return {
        "visible_bbox": list(visible),
        "stable_bbox": list(stable),
        "foot_y": stable[3],
        "torso_center_x": center_x,
        "source_edge_contact": {
            "left": visible[0] == 0,
            "right": visible[2] == alpha.shape[1] - 1,
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
    source_pixels = np.asarray(source)
    alpha = np.asarray(source.getchannel("A"))
    masks = segment_frames(alpha)
    frames = [analyze_frame(alpha, visible_mask, stable_mask) for visible_mask, stable_mask in masks]

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
        "segmentation": "four largest 2D Alpha components with low-Alpha fringe propagation",
        "safety_margin": safety_margin,
        "target_foot_y": target_foot_y,
        "target_torso_x": target_torso_x,
        "resampling": "none; source pixels copied exactly",
        "frames": [],
    }
    outputs: list[Image.Image] = []

    for index, (frame, (frame_mask, _)) in enumerate(zip(frames, masks), 1):
        left, top, right, bottom = frame["visible_bbox"]
        isolated_pixels = np.where(frame_mask[:, :, None], source_pixels, 0).astype(np.uint8)
        crop = Image.fromarray(isolated_pixels, "RGBA").crop((left, top, right + 1, bottom + 1))
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
