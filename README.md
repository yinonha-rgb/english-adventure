# Emily — הרפתקה באנגלית

A warm, bilingual, child-friendly English learning PWA for ages 6–12. Core learning works entirely offline. Optional Firebase Authentication and Cloud Firestore synchronization lets a parent securely carry family progress between devices without adding an application server.

The voice teacher now uses six human-style answer categories, three difficulty levels, misconception explanations, spaced review, and parent learning insights. See [HUMAN_TEACHER_HE.md](HUMAN_TEACHER_HE.md).

## Architecture migration

The application is being split incrementally so existing progress and deployed flows remain compatible throughout the migration. Version 4.43 introduces `services/storage.js` and `services/state.js` as the single tested foundation for local persistence, immutable snapshots, active-profile lookup, idempotent XP awards, and deduplicated mistakes. The existing `ea-v2` localStorage key and Firestore document shape are intentionally unchanged. Pages and routing will move onto this foundation in later, separately tested phases rather than through a risky all-at-once rewrite.

## Highlights

Version 4.53.0 replaces flat teacher motion with 15-part articulated puppets for Emily and Adam, including independently animated heads, torsos, arms, hands and legs.

Version 5.3.1 keeps the selected teacher's identity consistent across the home and lesson experience. The live label, Hebrew grammar, journey copy and accessible animation announcements now switch together between Emily and Adam, with no raw technical state names exposed to screen readers.

Version 5.3.2 makes camera and microphone permission preparation non-blocking. The daily lesson, teacher prompt and button fallback now appear immediately even while the browser is still waiting for a permission decision.

- Hebrew-first parent-facing interface with an English switch and complete RTL support
- Multiple editable child profiles with separate progress stored in `localStorage`
- 22 practical lessons across greetings, family, colors, numbers, food, home, school, animals, body, clothing, weather, emotions, shopping, café, directions, and travel
- English text-to-speech and optional Web Speech Recognition pronunciation scoring
- Quizzes, sentence ordering, lesson review, XP, levels, streaks, badges, trophies, daily goals, and guarded one-time awards
- Per-child mistake bank with timestamp-based spaced review
- Parent dashboard behind a local four-digit convenience PIN, including progress, recent activity, reset, JSON export, and JSON import
- Optional Google parent sign-in and near-real-time UID-isolated Firestore synchronization
- Conflict-safe Hebrew migration, offline change queue, manual sync, cloud deletion backup, and account controls
- Interactive lesson-scoped free voice teacher with a nine-phase teaching flow and a no-cost local mock mode
- Local Hebrew/English classroom-intent handling, live recognition transcript, bounded recognition recovery, and deterministic answer validation
- Offline accessibility center with readable font, text scaling, letter spacing, high contrast, a pointer-following reading ruler, and an explicit reduced-motion preference
- Offline caching, install support, versioned updates, keyboard navigation, focus trapping, and reduced-motion support

## Install and run

The published app is available at [https://yinonha-rgb.github.io/english-adventure/](https://yinonha-rgb.github.io/english-adventure/).

To run locally, serve the directory over HTTP (service workers do not work from `file://`):

```bash
python -m http.server 8000
```

Open `http://localhost:8000`. On supported browsers, use the **Install** button or the browser’s installation menu.

## Browser support

Current Chrome, Edge, Firefox, and Safari support the core lessons, profiles, quizzes, progress, and offline use. Speech synthesis availability and installed voices vary by device. Speech recognition currently works best in Chromium-based browsers; when unavailable, the app explains that listening and spoken repetition remain usable. Microphone permission is requested from the user action that starts a voice lesson or presses a microphone control; denial never blocks the visual answer fallback.

## Firebase synchronization setup

Cloud sync is disabled until `firebase-config.js` is filled in. Follow the complete Hebrew guide in [`FIREBASE_SETUP_HE.md`](FIREBASE_SETUP_HE.md), then publish the included [`firestore.rules`](firestore.rules).

Firebase web configuration can be committed because it identifies the public web app; it is not a private credential. Security relies on Google Authentication and Firestore rules. Never commit service-account JSON, Admin SDK private keys, access tokens, or other server credentials.

## Voice teacher

Version 4.20 improves the free teacher with local conversational intent handling. The child can ask to repeat, slow down, explain a word, give a hint, try again, pause, or finish in Hebrew or English. Chrome recognition may recover from an early empty stop up to two times, but recognition errors never count as wrong answers and never create an endless retry loop. A subtle live transcript shows what the browser heard.

Version 4.48 improves recognition without weakening answer validation. When Chrome returns several possible transcripts, the teacher ranks all of them against the current exercise instead of blindly using only the first. A bounded retry alternates to Hebrew when the exercise accepts Hebrew and English answers. The selected transcript still passes through the same strict deterministic validator, so unrelated speech is never accepted merely because it appeared in the recognition alternatives.

Version 4.49 makes the interactive lesson feel smoother and less repetitive. Correct-answer celebrations now finish before the next instruction begins, praise rotates through adventure-themed responses involving Pip and the magic path, and a paused lesson resumes at the pending next activity. Devices without speech synthesis continue immediately through the same visual flow instead of getting stuck.

Version 4.50 introduces a shared visual-polish layer for the home and lesson experience: consistent translucent surfaces, clearer elevation and button feedback, richer progress treatment, and a friendly branded camera-loading state instead of a harsh black tile. The layer preserves RTL, responsive breakpoints, keyboard focus, and reduced-motion behavior.

Version 4.51 protects learning integrity in the standard lesson flow. Quiz choices are deterministically reordered per child and lesson, incorrect answers receive one real retry before a concise explanation, and pronunciation XP is awarded only after microphone speech passes validation. The mobile welcome screen now keeps its primary action above the video, makes the background inert while open, and restores focus without scrolling past the teacher experience.

The **Free Guided Teacher** is the production teacher. It runs entirely with browser speech features and deterministic lesson logic and never calls a paid API. The repository retains a local mock provider for testing architecture, but the advanced provider is locked in the shipped build: `ADVANCED_AI_ENABLED` is `false`, its endpoint is empty, real pricing is unset, the backend transport is explicitly `implemented:false`, no OpenAI secret is bound, and backend deployment is intentionally blocked.

Hebrew guides: [teacher-mode comparison](TEACHER_MODES_HE.md) and [free teacher](FREE_VOICE_TEACHER_HE.md).

The teacher actively runs a structured lesson through greeting, warm-up, vocabulary teaching, listen-and-repeat, comprehension, speaking, review, summary, and goodbye. It includes microphone controls, conservative pronunciation feedback, reconnection behavior, parent consent and limits, optional transcript retention, usage reporting, Hebrew parent summaries, and a child achievement screen.

Version 4.6 adds a completely local natural-speech layer for the free teacher: ranked operating-system voices, separate English/Hebrew selection, phrase queues, varied speaking rates, protected turn-taking, interruption recovery, calibration previews, and a temporary “יותר לאט” replay. Browser synthesis quality still depends on voices installed on the device and is not presented as identical to a human voice.

No production code sends lesson audio or text to OpenAI. Temporary answer recordings remain only in browser memory when the parent has enabled that feature and are deleted at the end of the answer flow.

The cloud document model is `users/{uid}/state/main`, with immutable deletion backups under `users/{uid}/backups/{backupId}`. Online writes use Firestore transactions with schema and revision fields. Offline edits remain queued locally and merge automatically when connectivity returns. Completed lessons and award ledgers are unioned, activity is deduplicated by stable IDs, tombstones protect profile deletion, and stale snapshots cannot blindly replace newer progress.

Version 4.23 adds a lightweight, silent, seamless animated WebP loop for each teacher while idle or listening. Speaking and gesture states automatically use the calibrated layered rig so lip placement remains accurate. The still PNG fallback, reduced-motion behavior, and offline cache are preserved.

Version 4.24 adds an optional self-view camera tile to the interactive lesson. Camera permission is requested only after the child or parent presses the camera button. The stream is displayed locally, never recorded or uploaded, and every media track is stopped when the tile or lesson closes, the page is left, or permission fails.

Version 4.44 adapts the useful classroom ideas from the Wordy prototype to the existing free lesson engine: a visible live speech transcript, a compact in-lesson difficulty selector, and clickable vocabulary cards with local pronunciation help. These features run entirely in the browser and do not call Gemini, OpenAI, or any paid backend.

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
- `teacher-ai.js` — free voice-teacher UI, state machine, local conversation intents, recognition recovery, reports, and parent controls
- `teacher-providers.js` — shared `ConversationProvider` contract with production `FreeConversationProvider`, deterministic `MockAdvancedConversationProvider`, and disabled `AdvancedConversationProvider`
- `classroom-tools.js` — live transcript, local pronunciation inspector, and in-lesson difficulty controls
- `functions/ai-backend-core.js` — disabled backend interfaces, authentication/ownership validation helpers, restrictive abuse and cost limits, and privacy-safe usage records
- `SECURE_AI_ARCHITECTURE.md` — trust boundaries, feature flags, future secret handling, privacy, limits, and fallback design
- `AI_ACTIVATION_CHECKLIST.md` — mandatory manual approvals before any real provider work or deployment
- `firebase-config.js` — public Firebase Web configuration; disabled placeholder until setup
- `firestore.rules` — UID-isolated Firestore authorization rules
- `FIREBASE_SETUP_HE.md` — beginner-friendly Firebase setup and testing guide in Hebrew
- `functions/` — locked future-backend scaffold and policy tests; production deployment is intentionally disabled
- `content.json` — bilingual lesson and quiz content
- `manifest.json` — PWA metadata, icons, and shortcuts
- `sw.js` — offline cache and update lifecycle
- `update-manifest.json` — release metadata
- `icon.svg` and `icon-maskable.svg` — locally generated PWA icons
