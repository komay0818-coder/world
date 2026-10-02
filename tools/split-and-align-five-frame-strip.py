from __future__ import annotations

import argparse
import importlib.util
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


def load_splitter(path: Path):
    spec = importlib.util.spec_from_file_location("four_frame_splitter", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def main() -> None:
    parser = argparse.ArgumentParser(description="Split and align a transparent five-frame character strip.")
    parser.add_argument("source", type=Path)
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()

    splitter = load_splitter(Path(__file__).with_name("split-transparent-four-frame-strip.py"))
    source = Image.open(args.source).convert("RGBA")
    pixels = np.asarray(source)
    alpha = np.asarray(source.getchannel("A"))
    masks = splitter.segment_frames(alpha, count=5)
    analyses = [splitter.analyze_frame(alpha, visible, stable) for visible, stable in masks]

    margin = 48
    max_width = max(item["visible_bbox"][2] - item["visible_bbox"][0] + 1 for item in analyses)
    max_height = max(item["visible_bbox"][3] - item["visible_bbox"][1] + 1 for item in analyses)
    canvas_size = (max_width + margin * 2, max_height + margin * 2)
    target_torso_x = canvas_size[0] // 2
    max_below_foot = max(item["visible_bbox"][3] - item["foot_y"] for item in analyses)
    target_foot_y = canvas_size[1] - margin - max_below_foot

    args.output_dir.mkdir(parents=True, exist_ok=True)
    source.save(args.output_dir / "source-strip.png", optimize=True)
    outputs: list[Image.Image] = []
    frames: list[dict[str, object]] = []

    for index, (analysis, (visible_mask, _)) in enumerate(zip(analyses, masks), 1):
        left, top, right, bottom = analysis["visible_bbox"]
        isolated = np.where(visible_mask[:, :, None], pixels, 0).astype(np.uint8)
        crop = Image.fromarray(isolated, "RGBA").crop((left, top, right + 1, bottom + 1))
        crop.save(args.output_dir / f"cut-{index:02d}.png", optimize=True)

        local_torso_x = float(analysis["torso_center_x"]) - left
        local_foot_y = int(analysis["foot_y"]) - top
        offset_x = round(target_torso_x - local_torso_x)
        offset_y = round(target_foot_y - local_foot_y)
        canvas = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
        canvas.alpha_composite(crop, (offset_x, offset_y))
        canvas.save(args.output_dir / f"frame-{index:02d}.png", optimize=True)
        outputs.append(canvas)
        frames.append({
            "frame": index,
            "source_visible_bbox": analysis["visible_bbox"],
            "source_stable_bbox": analysis["stable_bbox"],
            "source_edge_contact": analysis["source_edge_contact"],
            "translation_xy": [offset_x, offset_y],
            "scale": 1.0,
            "aligned_foot_y": target_foot_y,
            "aligned_torso_center_x": target_torso_x,
            "output_bbox": splitter.alpha_metrics(canvas),
        })

    thumb_width = 260
    thumb_height = round(thumb_width * canvas_size[1] / canvas_size[0])
    contact = Image.new("RGBA", (thumb_width * 5, thumb_height + 42), (8, 12, 24, 255))
    draw = ImageDraw.Draw(contact)
    for index, image in enumerate(outputs, 1):
        preview = image.resize((thumb_width, thumb_height), Image.Resampling.LANCZOS)
        contact.alpha_composite(preview, ((index - 1) * thumb_width, 0))
        draw.text(((index - 1) * thumb_width + 10, thumb_height + 12), f"Frame {index}", fill=(235, 240, 255, 255))
    contact.save(args.output_dir / "contact-sheet.png", optimize=True)

    colors = [(255, 70, 70), (255, 205, 70), (80, 230, 135), (70, 180, 255), (205, 100, 255)]
    overlay = Image.new("RGBA", canvas_size, (8, 12, 24, 255))
    for image, color in zip(outputs, colors):
        layer = Image.new("RGBA", canvas_size, (*color, 0))
        layer.putalpha(image.getchannel("A").point(lambda value: min(90, value * 90 // 255)))
        overlay = Image.alpha_composite(overlay, layer)
    overlay.save(args.output_dir / "alignment-overlay.png", optimize=True)

    report = {
        "source": str(args.source),
        "source_canvas": {"width": source.width, "height": source.height},
        "output_canvas": {"width": canvas_size[0], "height": canvas_size[1]},
        "sequence": [1, 2, 3, 4, 5],
        "duration_ms": 2500,
        "frame_duration_ms": 500,
        "loop": False,
        "alignment": "opaque torso center X and shoe-sole Y; translation only",
        "resampling": "none; source pixels copied exactly",
        "frames": frames,
    }
    (args.output_dir / "alignment-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )


if __name__ == "__main__":
    main()
