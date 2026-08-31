# Emily Flow sample — 2026-09-01

User-supplied file: `Character_animation_instructions…_202609010002.mp4`.
Local copy: `assets/emily-listening-flow-v1.mp4` (2,712,770 bytes).
Browser decoded metadata: 720×1280, 8 seconds. Muted inline playback works.

Processed preview: `assets/emily-flow-cropped-v1.mp4`, 720×960, 24 fps.
FFmpeg crop detection confirmed 160 black pixels above and below the artwork.
The derivative removes exactly those bars, removes the audio track completely,
and moves MP4 metadata to the beginning for progressive playback. The original
file remains unchanged. This does not fix the mouth animation.

## Final disposition

Both generated clips open the mouth and change hand pose. They are rejected for
listening and lip synchronization. The corrected clip is approved only as a
brief visual greeting/wave, where those motions match the state.

The production derivative is `assets/emily-greeting-flow-v1.mp4`: 720×960,
silent, progressively loadable, with the embedded black bars removed. It may
run only for `greeting`/`waving`, stops before speech/listening/paused states,
respects reduced motion, and falls back to the existing artwork on failure.
No runtime AI/API calls are involved.

Preview: `/prototypes/teacher-video-check.html` on the local static server.
