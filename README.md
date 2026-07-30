# English Adventure — הרפתקה באנגלית

A warm, bilingual, child-friendly English learning PWA for ages 6–12. Core learning works entirely offline. Optional Firebase Authentication and Cloud Firestore synchronization lets a parent securely carry family progress between devices without adding an application server.

The voice teacher now uses six human-style answer categories, three difficulty levels, misconception explanations, spaced review, and parent learning insights. See [HUMAN_TEACHER_HE.md](HUMAN_TEACHER_HE.md).

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
- Interactive lesson-scoped AI voice teacher with a nine-phase teaching flow and a no-cost local demo mode
- Optional secure Firebase Functions bridge for short-lived OpenAI Realtime WebRTC credentials; the permanent API key never reaches GitHub Pages
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

## AI voice teacher

Version 4.9 adds a selectable, fully local Mock AI provider and a shared provider interface for the free, mock, and future real teachers. The shipped build has an immutable `ADVANCED_AI_ENABLED: false` lock, an empty backend endpoint, zero real pricing assumptions, and an intentionally blocked backend deployment command. Mock usage and cost estimates are clearly marked as simulated and always report zero paid requests. See [`ADVANCED_AI_ACTIVATION_HE.md`](ADVANCED_AI_ACTIVATION_HE.md) for the approval-gated future activation checklist.

Version 4.1 provides two clearly separated teacher modes. The **Free Guided Teacher** is the default, runs entirely with browser speech features and scripted lesson logic, and never calls a paid API. The optional **Advanced AI Teacher** uses the prepared authenticated backend and remains disabled until billing, secrets, deployment, and explicit parent consent are configured.

Hebrew guides: [teacher-mode comparison](TEACHER_MODES_HE.md), [free teacher](FREE_VOICE_TEACHER_HE.md), and [advanced setup](ADVANCED_AI_TEACHER_SETUP_HE.md).

The teacher actively runs a structured lesson through greeting, warm-up, vocabulary teaching, listen-and-repeat, comprehension, speaking, review, summary, and goodbye. It includes microphone controls, conservative pronunciation feedback, reconnection behavior, parent consent and limits, optional transcript retention, usage reporting, Hebrew parent summaries, and a child achievement screen.

The repository ships with `teacherAIConfig.demoMode: true`, so the interface can be tested locally without a paid API request. Real voice conversation requires the included authenticated Cloud Function, Firebase billing, a Secret Manager entry named `OPENAI_API_KEY`, and a deployed endpoint. Follow [TEACHER_AI_SETUP_HE.md](TEACHER_AI_SETUP_HE.md). OpenAI API usage creates external charges; neither this project nor Firebase makes that usage free.

Version 4.6 adds a completely local natural-speech layer for the free teacher: ranked operating-system voices, separate English/Hebrew selection, phrase queues, varied speaking rates, protected turn-taking, interruption recovery, calibration previews, and a temporary “יותר לאט” replay. Browser synthesis quality still depends on voices installed on the device and is not presented as identical to a human voice.

The browser never receives the permanent OpenAI key. It requests a Firebase-authenticated, short-lived Realtime credential from `teacherApi` and uses WebRTC directly for low-latency audio. Raw microphone audio is not stored by default. The server rechecks parent consent, scopes records to the parent UID and child ID, enforces daily/monthly limits transactionally, bounds lesson context, and applies a child-safety system prompt.

The cloud document model is `users/{uid}/state/main`, with immutable deletion backups under `users/{uid}/backups/{backupId}`. Online writes use Firestore transactions with schema and revision fields. Offline edits remain queued locally and merge automatically when connectivity returns. Completed lessons and award ledgers are unioned, activity is deduplicated by stable IDs, tombstones protect profile deletion, and stale snapshots cannot blindly replace newer progress.

## Adaptive difficulty

Version 4.5 adds seven independent 1–10 skill levels, conservative evidence-based promotion, delayed review, temporary in-lesson support, a friendly placement check, and Hebrew parent controls. Both teacher modes use the same limits and per-child state. See [`ADAPTIVE_DIFFICULTY_HE.md`](ADAPTIVE_DIFFICULTY_HE.md) for the exact rules.

## Privacy and parent PIN

Without sign-in, all names, progress, mistakes, and activity stay on the learner’s device. After the parent explicitly signs in and approves migration, learning data is stored in that parent UID’s Firestore area for synchronization. The four-digit parent PIN remains a convenience lock, not encryption or real security; only its SHA-256 hash is synchronized. Clearing site data removes unsynchronized progress unless it was exported first.

## Updates

`sw.js` uses a versioned same-origin cache. It never intercepts or caches Google sign-in, Firestore, or other cross-origin cloud responses. A newly installed service worker waits while a lesson is open; the app then displays a **New version available** prompt. Pressing **Update** activates the new cache and reloads cleanly. `update-manifest.json` records the release.

## Project structure

- `index.html` — accessible responsive interface and styles
- `app.js` — profiles, learning flow, speech, review, gamification, parent tools, and updates
- `firebase-sync.js` — authentication, merging, transactions, live snapshots, offline queue, and account UI
- `teacher-ai.js` — voice-teacher UI, state machine, WebRTC client, demo mode, recovery, reports, and parent controls
- `firebase-config.js` — public Firebase Web configuration; disabled placeholder until setup
- `firestore.rules` — UID-isolated Firestore authorization rules
- `FIREBASE_SETUP_HE.md` — beginner-friendly Firebase setup and testing guide in Hebrew
- `TEACHER_AI_SETUP_HE.md` — billing, secrets, Functions, usage limits, App Check, microphone and Realtime setup in Hebrew
- `functions/` — authenticated server endpoint, short-lived Realtime credential creation, usage enforcement, and policy tests
- `content.json` — bilingual lesson and quiz content
- `manifest.json` — PWA metadata, icons, and shortcuts
- `sw.js` — offline cache and update lifecycle
- `update-manifest.json` — release metadata
- `icon.svg` and `icon-maskable.svg` — locally generated PWA icons
