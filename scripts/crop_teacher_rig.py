from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"

RIGS = {
    "noa": {
        "source": "teacher-noa-rig-v2.png",
        "body": (43, 40, 353, 940),
        "expression": {
            "neutral": (400, 105, 580, 360), "happy": (590, 105, 770, 360),
            "listening": (775, 105, 960, 360), "thinking": (970, 105, 1150, 360),
            "encouraging": (1150, 105, 1325, 360), "celebrating": (1325, 90, 1505, 360),
        },
        "mouth": {
            "rest": (455, 440, 585, 560), "a": (665, 440, 790, 560),
            "e": (860, 440, 985, 560), "o": (1070, 440, 1195, 560),
            "smile": (1250, 440, 1405, 560),
        },
    },
    "adam": {
        "source": "teacher-adam-rig-v2.png",
        "body": (48, 40, 363, 940),
        "expression": {
            "neutral": (425, 95, 600, 320), "happy": (615, 95, 790, 320),
            "listening": (790, 85, 965, 320), "thinking": (965, 85, 1140, 320),
            "encouraging": (1140, 85, 1320, 320), "celebrating": (1320, 80, 1505, 325),
        },
        "mouth": {
            "rest": (470, 420, 615, 540), "a": (670, 420, 815, 540),
            "e": (855, 420, 1000, 540), "o": (1045, 420, 1190, 540),
            "smile": (1225, 420, 1380, 540),
        },
    },
}

for teacher, spec in RIGS.items():
    image = Image.open(ASSETS / spec["source"]).convert("RGBA")
    image.crop(spec["body"]).save(ASSETS / f"teacher-{teacher}-body-v2.png", optimize=True)
    for group in ("expression", "mouth"):
        for name, box in spec[group].items():
            image.crop(box).save(ASSETS / f"teacher-{teacher}-{group}-{name}-v2.png", optimize=True)
