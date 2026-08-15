from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "character-action-sources"
OUTPUT = ROOT / "assets" / "character-actions"
CANVAS = 1280
PADDING = 48


def normalize(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    bounds = alpha.getbbox()
    if not bounds:
        raise ValueError("image contains no visible subject")
    subject = image.crop(bounds)
    maximum = CANVAS - PADDING * 2
    ratio = min(maximum / subject.width, maximum / subject.height)
    subject = subject.resize(
        (max(1, round(subject.width * ratio)), max(1, round(subject.height * ratio))),
        Image.Resampling.LANCZOS,
    )
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    x = (CANVAS - subject.width) // 2
    y = CANVAS - PADDING - subject.height
    canvas.alpha_composite(subject, (x, y))
    return canvas


def main() -> None:
    files = sorted(SOURCE.rglob("*.png"))
    if len(files) != 54:
        raise SystemExit(f"expected 54 source images, found {len(files)}")
    for source in files:
        relative = source.relative_to(SOURCE)
        destination = OUTPUT / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(source) as raw:
            normalize(raw.convert("RGBA")).save(destination, optimize=True)
        print(relative.as_posix())


if __name__ == "__main__":
    main()
