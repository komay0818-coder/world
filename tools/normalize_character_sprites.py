"""Normalize battle character art to one shared canvas and foot anchor."""

from __future__ import annotations

import re
from math import ceil
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = ROOT / "script.js"
OUTPUT_DIR = ROOT / "assets" / "character-sprites"
TARGET_HEIGHT = 1200
MIN_CANVAS_WIDTH = 2048


def mapped_character_art() -> list[tuple[str, Path]]:
    source = SCRIPT_PATH.read_text(encoding="utf-8")
    block = source.split("const battleCharacterArt = {", 1)[1].split("};", 1)[0]
    entries = re.findall(r"'([^']+)': '([^']+)'", block)
    return [(key, ROOT / relative_path) for key, relative_path in entries]


def alpha_crop(image: Image.Image) -> Image.Image:
    alpha_box = image.getchannel("A").getbbox()
    if alpha_box is None:
        raise ValueError("sprite has no visible pixels")
    return image.crop(alpha_box)


def main() -> None:
    sprites = [(key, path, alpha_crop(Image.open(path).convert("RGBA"))) for key, path in mapped_character_art()]
    max_aspect = max(sprite.width / sprite.height for _, _, sprite in sprites)
    canvas_width = max(MIN_CANVAS_WIDTH, ceil(TARGET_HEIGHT * max_aspect))
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for key, source_path, sprite in sprites:
        scale = TARGET_HEIGHT / sprite.height
        target_width = round(sprite.width * scale)
        resized = sprite.resize((target_width, TARGET_HEIGHT), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (canvas_width, TARGET_HEIGHT), (0, 0, 0, 0))
        anchor_x = (canvas_width - target_width) // 2
        canvas.alpha_composite(resized, (anchor_x, 0))
        output_path = OUTPUT_DIR / f"{key.replace(':', '-')}.png"
        canvas.save(output_path, optimize=True)
        print(
            f"{key}: {source_path.name} -> {output_path.relative_to(ROOT)} "
            f"canvas={canvas_width}x{TARGET_HEIGHT} subject={target_width}x{TARGET_HEIGHT} "
            f"anchor=({canvas_width // 2},{TARGET_HEIGHT})"
        )

    print(f"CANVAS_WIDTH={canvas_width}")
    print(f"CANVAS_HEIGHT={TARGET_HEIGHT}")


if __name__ == "__main__":
    main()
