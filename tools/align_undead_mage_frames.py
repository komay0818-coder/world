from pathlib import Path

from PIL import Image


SOURCES = [
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-2f4fd260-231e-43ff-a6c5-6d7c521c4241.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-51db13f1-790c-4d63-8070-0c0ba616b437.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-312828c4-be06-4971-bf44-b391b9ff65ad.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-9331b3bb-cd6b-4bbe-97a8-1e4c8377b9b6.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-4a1a3a75-2db1-4e55-93e2-3a106f1699f4.png"),
]

OUTPUT_DIR = Path("assets/character-portraits/calibration-tests/undead-mage-five-frame-v1")
CANVAS_SIZE = (1400, 1400)

# Transform values are based on the shoe baseline and torso/belt center, not on
# the staff, hair, robe, hand, or magic-effect extents.
TRANSFORMS = [
    (1.000, 90, 130),
    (0.879, 173, 132),
    (1.000, 50, 130),
    (1.000, 50, 130),
    (1.000, 50, 130),
]


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for index, (source, (scale, x, y)) in enumerate(zip(SOURCES, TRANSFORMS), 1):
        image = Image.open(source).convert("RGBA")
        if scale != 1.0:
            size = (round(image.width * scale), round(image.height * scale))
            image = image.resize(size, Image.Resampling.LANCZOS)

        canvas = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
        canvas.alpha_composite(image, (x, y))
        canvas.save(OUTPUT_DIR / f"frame-{index:02d}.png", optimize=True)


if __name__ == "__main__":
    main()
