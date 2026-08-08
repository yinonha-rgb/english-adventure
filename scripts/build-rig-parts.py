from pathlib import Path
from PIL import Image
from collections import deque

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

def remove_detached_islands(image):
    """Discard neighboring-cell debris while preserving the actual body part."""
    alpha = image.getchannel("A")
    pixels = alpha.load()
    width, height = image.size
    seen = set()
    components = []
    for y in range(height):
        for x in range(width):
            if pixels[x, y] < 20 or (x, y) in seen:
                continue
            queue = deque([(x, y)])
            seen.add((x, y))
            points = []
            while queue:
                px, py = queue.popleft()
                points.append((px, py))
                for nx, ny in ((px - 1, py), (px + 1, py), (px, py - 1), (px, py + 1)):
                    if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in seen and pixels[nx, ny] >= 20:
                        seen.add((nx, ny))
                        queue.append((nx, ny))
            components.append(points)
    if not components:
        return image
    # Each exported cell represents exactly one anatomical part. Keeping only
    # the largest connected silhouette prevents a neighboring hand, shoe or
    # label fragment from becoming an apparent extra limb in the assembled rig.
    keep = set(max(components, key=len))
    cleaned = image.copy()
    cleaned_alpha = cleaned.getchannel("A")
    cleaned_pixels = cleaned_alpha.load()
    for y in range(height):
        for x in range(width):
            if (x, y) not in keep:
                cleaned_pixels[x, y] = 0
    cleaned.putalpha(cleaned_alpha)
    return trim(cleaned)

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
        trimmed = remove_detached_islands(isolate_joint(part, trim(cell)))
        trimmed.save(output / f"{part}.png", optimize=True)

for teacher in ("emily", "adam"):
    build(teacher)
