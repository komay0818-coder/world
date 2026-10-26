from pathlib import Path
import json

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "character-portraits" / "calibration-tests" / "elf-assassin-selection-five-frame-v4"
SOURCES = [
    Path(r"C:\Users\User\.codex\generated_images\01a0de46-a553-7953-8ee2-63440819c66e\exec-5c68d228-64bd-47b2-b020-f060568cfd66.png"),
    Path(r"C:\Users\User\.codex\generated_images\01a0de46-a553-7953-8ee2-63440819c66e\exec-629782ef-9c4f-44a8-9fbe-4769efa3914c.png"),
    Path(r"C:\Users\User\.codex\generated_images\01a0de46-a553-7953-8ee2-63440819c66e\exec-8b24a28d-1bd6-4a0d-99d9-71ce46e3eeea.png"),
    Path(r"C:\Users\User\.codex\generated_images\01a0de46-a553-7953-8ee2-63440819c66e\exec-baa9acab-6000-4ccf-9b0c-edc57d8c8b46.png"),
    Path(r"C:\Users\User\.codex\generated_images\01a0de46-a553-7953-8ee2-63440819c66e\exec-2529c4c6-4048-4ede-b06b-3dfada3d37a6.png"),
]

CANVAS = (1200, 1536)
TARGET_VISIBLE_HEIGHT = 1320
TARGET_CENTER_X = 600
TARGET_BOTTOM_Y = 1500
FRAME_DURATION_MS = 400


def resize_premultiplied(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    red, green, blue, alpha = image.convert("RGBA").split()
    premultiplied = Image.merge(
        "RGBA",
        tuple(
            Image.eval(channel, lambda value, a=alpha: value)
            for channel in (red, green, blue)
        ) + (alpha,),
    )
    return premultiplied.resize(size, Image.Resampling.LANCZOS)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    report = {
        "canvas": list(CANVAS),
        "target_visible_height": TARGET_VISIBLE_HEIGHT,
        "target_center_x": TARGET_CENTER_X,
        "target_bottom_y": TARGET_BOTTOM_Y,
        "duration_ms": FRAME_DURATION_MS * len(SOURCES),
        "frame_duration_ms": FRAME_DURATION_MS,
        "order": [1, 2, 3, 4, 5],
        "loop": False,
        "frames": [],
    }
    frames = []
    for index, source in enumerate(SOURCES, 1):
        with Image.open(source) as raw:
            rgba = raw.convert("RGBA")
        bounds = rgba.getchannel("A").point(lambda value: 255 if value > 8 else 0).getbbox()
        if not bounds:
            raise ValueError(f"frame {index} has no visible pixels")
        subject = rgba.crop(bounds)
        scale = TARGET_VISIBLE_HEIGHT / subject.height
        resized = subject.resize(
            (round(subject.width * scale), TARGET_VISIBLE_HEIGHT),
            Image.Resampling.LANCZOS,
        )
        canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
        x = round(TARGET_CENTER_X - resized.width / 2)
        y = TARGET_BOTTOM_Y - resized.height
        canvas.alpha_composite(resized, (x, y))
        destination = OUTPUT / f"frame-{index:02d}.png"
        canvas.save(destination, optimize=True)
        frames.append(canvas)
        report["frames"].append({
            "frame": index,
            "source": str(source),
            "source_bounds": list(bounds),
            "source_visible_size": [subject.width, subject.height],
            "scale": round(scale, 6),
            "output_visible_size": [resized.width, resized.height],
            "placement": [x, y],
        })

    thumb = (300, 384)
    contact = Image.new("RGBA", (thumb[0] * len(frames), thumb[1]), (20, 24, 38, 255))
    for index, frame in enumerate(frames):
        contact.alpha_composite(frame.resize(thumb, Image.Resampling.LANCZOS), (index * thumb[0], 0))
    contact.save(OUTPUT / "contact-sheet.png", optimize=True)
    (OUTPUT / "analysis.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
