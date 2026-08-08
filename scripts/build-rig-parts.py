from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PARTS = {
    "head": (0, 0), "hair-back": (1, 0), "neck": (2, 0), "torso": (3, 0),
    "arm-left-upper": (0, 1), "arm-left-lower": (1, 1), "hand-left": (2, 1),
    "arm-right-upper": (3, 1), "arm-right-lower": (0, 2), "hand-right": (1, 2),
    "hips": (2, 2), "leg-left-upper": (3, 2), "leg-left-lower": (0, 3),
    "leg-right-upper": (1, 3), "leg-right-lower": (2, 3),
}

def trim(image):
    alpha = image.getchannel("A")
    box = alpha.getbbox()
    return image.crop(box) if box else image.crop((0, 0, 1, 1))

def isolate_joint(part, image):
    width, height = image.size
    if part == "torso":
        image = image.crop((round(width * .21), 0, round(width * .79), height))
    elif part.endswith("upper") and part.startswith("arm-"):
        image = image.crop((0, 0, width, round(height * .58)))
    elif part.endswith("lower") and part.startswith("arm-"):
        image = image.crop((0, 0, width, round(height * .66)))
    return trim(image)

def build(name):
    source = Image.open(ROOT / "assets" / "rigs" / f"{name}-sheet.png").convert("RGBA")
    output = ROOT / "assets" / "rigs" / name
    output.mkdir(parents=True, exist_ok=True)
    x_edges = [round(source.width * index / 4) for index in range(5)]
    y_edges = [round(source.height * index / 4) for index in range(5)]
    for part, (column, row) in PARTS.items():
        cell = source.crop((x_edges[column], y_edges[row], x_edges[column + 1], y_edges[row + 1]))
        trimmed = isolate_joint(part, trim(cell))
        trimmed.save(output / f"{part}.png", optimize=True)

for teacher in ("emily", "adam"):
    build(teacher)
