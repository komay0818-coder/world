from collections import deque
from pathlib import Path

from PIL import Image


SOURCE = Path(
    r"C:\Users\User\.codex\codex-remote-attachments\01a0de46-a553-7953-8ee2-63440819c66e"
    r"\B1D941A9-98D4-4803-8E67-5E78F6E3C1A8\1-貼上的圖片-1.jpg"
)
OUTPUT_DIR = Path("assets/character-portraits/calibration-tests/undead-rise-five-frame-v1")

# The first two poses nearly touch, so explicit frame boundaries are safer than
# treating all non-white pixels as connected components.
FRAME_BOXES = [
    (8, 205, 282, 490),
    (278, 170, 536, 484),
    (535, 125, 770, 488),
    (782, 120, 1022, 489),
    (1034, 120, 1274, 489),
]

# Shoe-bottom Y coordinates in the original strip. The lowered hand in the first
# two poses extends beneath the boots, so the alpha bounds cannot be used as the
# ground line for those frames.
SHOE_BASELINES = [474, 469, 477, 477, 477]

CANVAS_SIZE = (320, 400)
FOOT_BASELINE = 382


def remove_connected_white_background(image: Image.Image) -> Image.Image:
    rgb = image.convert("RGB")
    width, height = rgb.size
    pixels = rgb.load()
    background = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def is_background_candidate(x: int, y: int) -> bool:
        red, green, blue = pixels[x, y]
        return min(red, green, blue) >= 218 and max(red, green, blue) - min(red, green, blue) <= 32

    def enqueue(x: int, y: int) -> None:
        index = y * width + x
        if not background[index] and is_background_candidate(x, y):
            background[index] = 1
            queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        if x:
            enqueue(x - 1, y)
        if x + 1 < width:
            enqueue(x + 1, y)
        if y:
            enqueue(x, y - 1)
        if y + 1 < height:
            enqueue(x, y + 1)

    rgba = rgb.convert("RGBA")
    alpha = Image.new("L", (width, height), 255)
    alpha_pixels = alpha.load()
    for y in range(height):
        for x in range(width):
            if background[y * width + x]:
                alpha_pixels[x, y] = 0
    rgba.putalpha(alpha)
    return rgba


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE).convert("RGB")

    for index, (box, shoe_baseline) in enumerate(zip(FRAME_BOXES, SHOE_BASELINES), 1):
        frame = remove_connected_white_background(source.crop(box))
        alpha_box = frame.getchannel("A").getbbox()
        if alpha_box is None:
            raise RuntimeError(f"Frame {index} has no visible pixels")
        frame = frame.crop(alpha_box)

        canvas = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
        x = round((CANVAS_SIZE[0] - frame.width) / 2)
        shoe_y_in_frame = shoe_baseline - box[1] - alpha_box[1]
        y = FOOT_BASELINE - shoe_y_in_frame
        canvas.alpha_composite(frame, (x, y))
        canvas.save(OUTPUT_DIR / f"frame-{index:02d}.png", optimize=True)


if __name__ == "__main__":
    main()
