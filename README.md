# English Adventure — הרפתקה באנגלית

A warm, bilingual, child-friendly English learning PWA for ages 6–12. Core learning works entirely offline. Optional Firebase Authentication and Cloud Firestore synchronization lets a parent securely carry family progress between devices without adding an application server.

## Highlights

- Hebrew-first parent-facing interface with an English switch and complete RTL support
- Multiple editable child profiles with separate progress stored in `localStorage`
- 22 practical lessons across greetings, family, colors, numbers, food, home, school, animals, body, clothing, weather, emotions, shopping, café, directions, and travel
- English text-to-speech and optional Web Speech Recognition pronunciation scoring
- Quizzes, sentence ordering, lesson review, XP, levels, streaks, badges, trophies, daily goals, and guarded one-time awards
- Per-child mistake bank with timestamp-based spaced review
- Parent dashboard behind a local four-digit convenience PIN, including progress, recent activity, reset, JSON export, and JSON import
- Optional Google parent sign-in and near-real-time UID-isolated Firestore synchronization
- Conflict-safe Hebrew migration, offline change queue, manual sync, cloud deletion backup, and account controls
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

## Firebase synchronization setup

Cloud sync is disabled until `firebase-config.js` is filled in. Follow the complete Hebrew guide in [`FIREBASE_SETUP_HE.md`](FIREBASE_SETUP_HE.md), then publish the included [`firestore.rules`](firestore.rules).

Firebase web configuration can be committed because it identifies the public web app; it is not a private credential. Security relies on Google Authentication and Firestore rules. Never commit service-account JSON, Admin SDK private keys, access tokens, or other server credentials.

The cloud document model is `users/{uid}/state/main`, with immutable deletion backups under `users/{uid}/backups/{backupId}`. Online writes use Firestore transactions with schema and revision fields. Offline edits remain queued locally and merge automatically when connectivity returns. Completed lessons and award ledgers are unioned, activity is deduplicated by stable IDs, tombstones protect profile deletion, and stale snapshots cannot blindly replace newer progress.

## Privacy and parent PIN

Without sign-in, all names, progress, mistakes, and activity stay on the learner’s device. After the parent explicitly signs in and approves migration, learning data is stored in that parent UID’s Firestore area for synchronization. The four-digit parent PIN remains a convenience lock, not encryption or real security; only its SHA-256 hash is synchronized. Clearing site data removes unsynchronized progress unless it was exported first.

## Updates

`sw.js` uses a versioned same-origin cache. It never intercepts or caches Google sign-in, Firestore, or other cross-origin cloud responses. A newly installed service worker waits while a lesson is open; the app then displays a **New version available** prompt. Pressing **Update** activates the new cache and reloads cleanly. `update-manifest.json` records the release.

## Project structure

- `index.html` — accessible responsive interface and styles
- `app.js` — profiles, learning flow, speech, review, gamification, parent tools, and updates
- `firebase-sync.js` — authentication, merging, transactions, live snapshots, offline queue, and account UI
- `firebase-config.js` — public Firebase Web configuration; disabled placeholder until setup
- `firestore.rules` — UID-isolated Firestore authorization rules
- `FIREBASE_SETUP_HE.md` — beginner-friendly Firebase setup and testing guide in Hebrew
- `content.json` — bilingual lesson and quiz content
- `manifest.json` — PWA metadata, icons, and shortcuts
- `sw.js` — offline cache and update lifecycle
- `update-manifest.json` — release metadata
- `icon.svg` and `icon-maskable.svg` — locally generated PWA icons
