from pathlib import Path

from PIL import Image


SOURCE = Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-47664947-3553-4c3a-b3f7-286defc23c21.png")
OUTPUT_DIR = Path("assets/character-portraits/calibration-tests/undead-chain-six-frame-v1")
X_RANGES = [(11, 370), (418, 700), (771, 1047), (1109, 1387), (1469, 1751), (1800, 2157)]
PADDING = 20


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for index, (left, right) in enumerate(X_RANGES, 1):
        strip = source.crop((left, 0, right, source.height))
        alpha_box = strip.getchannel("A").getbbox()
        if alpha_box is None:
            raise RuntimeError(f"Frame {index} contains no visible pixels")

        frame = strip.crop(alpha_box)
        canvas = Image.new(
            "RGBA",
            (frame.width + PADDING * 2, frame.height + PADDING * 2),
            (0, 0, 0, 0),
        )
        canvas.alpha_composite(frame, (PADDING, PADDING))
        canvas.save(OUTPUT_DIR / f"frame-{index:02d}.png", optimize=True)


if __name__ == "__main__":
    main()
