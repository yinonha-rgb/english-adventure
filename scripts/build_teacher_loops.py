"""Build small, transparent, seamless idle loops for the two teacher rigs."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
TEACHERS = ("noa", "adam")
FRAME_COUNT = 24
FRAME_DURATION_MS = 120


def make_frame(source: Image.Image, phase: float) -> Image.Image:
    width, height = source.size
    # The cycle returns exactly to its starting pose. Motion stays intentionally
    # small so facial overlays remain believable when the static rig takes over.
    sway = math.sin(phase) * 0.32
    breathe = 1 + (math.sin(phase - math.pi / 2) + 1) * 0.0016
    lift = round((math.sin(phase - math.pi / 2) + 1) * -0.7)
    scaled_height = round(height * breathe)
    body = source.resize((width, scaled_height), Image.Resampling.LANCZOS)
    body = body.rotate(sway, Image.Resampling.BICUBIC, center=(width / 2, scaled_height * 0.94))
    frame = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    frame.alpha_composite(body, (0, height - scaled_height + lift))
    return frame


def build(teacher: str) -> None:
    source_path = ASSETS / f"teacher-{teacher}-body-v2.png"
    output_path = ASSETS / f"teacher-{teacher}-idle-loop-v1.webp"
    source = Image.open(source_path).convert("RGBA")
    frames = [make_frame(source, index * 2 * math.pi / FRAME_COUNT) for index in range(FRAME_COUNT)]
    frames[0].save(
        output_path,
        format="WEBP",
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_DURATION_MS,
        loop=0,
        lossless=False,
        quality=78,
        method=3,
        minimize_size=True,
    )
    print(f"built {output_path.relative_to(ROOT)} ({output_path.stat().st_size:,} bytes)")


if __name__ == "__main__":
    for teacher_name in TEACHERS:
        build(teacher_name)
