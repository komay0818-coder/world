from pathlib import Path

from PIL import Image


SOURCES = [
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-229080ee-6f7c-4743-be4b-804b22488696.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-953f1935-220b-4bbe-8066-cf3b7e614032.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-289f9a0c-f390-473a-bf27-0b68c61ccbbf.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-1bfd7822-26fa-45c2-856f-dd8d3672ebb9.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-4b6d562c-2d61-46df-a49e-2f8a1756d039.png"),
]

OUTPUT_DIR = Path("assets/character-portraits/calibration-tests/undead-rise-five-frame-v2")
CANVAS_SIZE = (1600, 1600)

# Translation is based on the shoe baseline and pelvis/torso center. The first
# two lowered hands extend below the boots and are deliberately ignored when
# choosing the ground line. All frames remain at their original 100% scale.
OFFSETS = [
    (150, 255),
    (210, 160),
    (230, 98),
    (220, 98),
    (230, 112),
]


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for index, (source, offset) in enumerate(zip(SOURCES, OFFSETS), 1):
        frame = Image.open(source).convert("RGBA")
        canvas = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
        canvas.alpha_composite(frame, offset)
        canvas.save(OUTPUT_DIR / f"frame-{index:02d}.png", optimize=True)


if __name__ == "__main__":
    main()
