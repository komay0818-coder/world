from pathlib import Path

from PIL import Image


SOURCE = Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-47664947-3553-4c3a-b3f7-286defc23c21.png")
OUTPUT_DIR = Path("assets/character-portraits/calibration-tests/undead-chain-six-frame-v2")
X_RANGES = [(11, 370), (418, 700), (771, 1047), (1109, 1387), (1469, 1751), (1800, 2157)]
X_OFFSETS = [60, 135, 145, 138, 130, 125]
SOURCE_Y_RANGE = (100, 560)
CANVAS_SIZE = (560, 480)
Y_OFFSET = 10


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for index, ((left, right), x_offset) in enumerate(zip(X_RANGES, X_OFFSETS), 1):
        frame = source.crop((left, SOURCE_Y_RANGE[0], right, SOURCE_Y_RANGE[1]))
        alpha = frame.getchannel("A").point(lambda value: 0 if value <= 8 else value)
        frame.putalpha(alpha)

        canvas = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
        canvas.alpha_composite(frame, (x_offset, Y_OFFSET))
        canvas.save(OUTPUT_DIR / f"frame-{index:02d}.png", optimize=True)


if __name__ == "__main__":
    main()
