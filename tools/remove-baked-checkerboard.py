from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


def border_connected(mask: np.ndarray) -> np.ndarray:
    height, width = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    queue: deque[tuple[int, int]] = deque()
    for x in range(width):
        if mask[0, x]: queue.append((0, x)); seen[0, x] = True
        if mask[height - 1, x]: queue.append((height - 1, x)); seen[height - 1, x] = True
    for y in range(height):
        if mask[y, 0] and not seen[y, 0]: queue.append((y, 0)); seen[y, 0] = True
        if mask[y, width - 1] and not seen[y, width - 1]: queue.append((y, width - 1)); seen[y, width - 1] = True
    while queue:
        y, x = queue.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < height and 0 <= nx < width and mask[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                queue.append((ny, nx))
    return seen


def main() -> None:
    parser = argparse.ArgumentParser(description="Remove a baked light-gray checkerboard without regenerating artwork.")
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    image = Image.open(args.source).convert("RGB")
    pixels = np.asarray(image).copy()
    maximum = pixels.max(axis=2)
    minimum = pixels.min(axis=2)
    neutral_light = (maximum - minimum <= 28) & (minimum >= 165)
    background = border_connected(neutral_light)

    rgba = np.dstack((pixels, np.where(background, 0, 255).astype(np.uint8)))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba, "RGBA").save(args.output, optimize=True)


if __name__ == "__main__":
    main()
