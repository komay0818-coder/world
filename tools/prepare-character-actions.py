from pathlib import Path

from PIL import Image
from rembg import new_session, remove


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "character-action-sources"
OUTPUT = ROOT / "assets" / "character-actions"
MAX_HEIGHT = 1280
EDGE_PADDING = 16


def extract_subject(image: Image.Image, session) -> Image.Image:
    if image.mode == "RGBA" and image.getchannel("A").getextrema() != (255, 255):
        return image
    return remove(image.convert("RGB"), session=session, alpha_matting=False)


def normalize(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    bounds = alpha.getbbox()
    if not bounds:
        raise ValueError("image contains no visible subject")
    subject = image.crop(bounds)
    if subject.height > MAX_HEIGHT:
        ratio = MAX_HEIGHT / subject.height
        subject = subject.resize(
            (max(1, round(subject.width * ratio)), MAX_HEIGHT), Image.Resampling.LANCZOS
        )
    canvas = Image.new(
        "RGBA",
        (subject.width + EDGE_PADDING * 2, subject.height + EDGE_PADDING * 2),
        (0, 0, 0, 0),
    )
    canvas.alpha_composite(subject, (EDGE_PADDING, EDGE_PADDING))
    return canvas


def main() -> None:
    files = sorted(SOURCE.rglob("*.png"))
    if len(files) != 54:
        raise SystemExit(f"expected 54 source images, found {len(files)}")
    session = new_session("u2net")
    for source in files:
        relative = source.relative_to(SOURCE)
        destination = OUTPUT / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(source) as raw:
            subject = extract_subject(raw.convert("RGBA"), session)
            normalize(subject).save(destination, optimize=True)
        print(relative.as_posix())


if __name__ == "__main__":
    main()
