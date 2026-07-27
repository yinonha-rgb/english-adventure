# English Adventure — הרפתקה באנגלית

A warm, bilingual, child-friendly English learning PWA for ages 6–12. It runs entirely in the browser with no account, server, analytics, advertising, or third-party API.

## Highlights

- Hebrew-first parent-facing interface with an English switch and complete RTL support
- Multiple editable child profiles with separate progress stored in `localStorage`
- 22 practical lessons across greetings, family, colors, numbers, food, home, school, animals, body, clothing, weather, emotions, shopping, café, directions, and travel
- English text-to-speech and optional Web Speech Recognition pronunciation scoring
- Quizzes, sentence ordering, lesson review, XP, levels, streaks, badges, trophies, daily goals, and guarded one-time awards
- Per-child mistake bank with timestamp-based spaced review
- Parent dashboard behind a local four-digit convenience PIN, including progress, recent activity, reset, JSON export, and JSON import
- Offline caching, install support, versioned updates, keyboard navigation, focus trapping, and reduced-motion support

## Install and run

The published app is available at [https://yinonha-rgb.github.io/english-adventure/](https://yinonha-rgb.github.io/english-adventure/).

To run locally, serve the directory over HTTP (service workers do not work from `file://`):

```bash
python -m http.server 8000
```

Open `http://localhost:8000`. On supported browsers, use the **Install** button or the browser’s installation menu.

## Browser support

Current Chrome, Edge, Firefox, and Safari support the core lessons, profiles, quizzes, progress, and offline use. Speech synthesis availability and installed voices vary by device. Speech recognition currently works best in Chromium-based browsers; when unavailable, the app explains that listening and spoken repetition remain usable. Microphone permission is requested only after the microphone button is pressed.

## Privacy and local PIN

All names, progress, mistakes, and activity stay on the learner’s device in browser storage. Nothing is transmitted. The four-digit parent PIN is only a local convenience lock; it is not encryption or real security. Clearing site data removes local progress unless it was exported first.

## Updates

`sw.js` uses a versioned cache. A newly installed service worker waits while a lesson is open; the app then displays a **New version available** prompt. Pressing **Update** activates the new cache and reloads cleanly. `update-manifest.json` records the user-facing release version and notes.

## Project structure

- `index.html` — accessible responsive interface and styles
- `app.js` — profiles, learning flow, speech, review, gamification, parent tools, and updates
- `content.json` — bilingual lesson and quiz content
- `manifest.json` — PWA metadata, icons, and shortcuts
- `sw.js` — offline cache and update lifecycle
- `update-manifest.json` — release metadata
- `icon.svg` and `icon-maskable.svg` — locally generated PWA icons
