# English Adventure

A friendly, mobile-first English learning web app with short lessons, browser-based pronunciation, quizzes, progress tracking, and offline support.

## Features

- Six practical lessons for beginner and elementary learners
- English speech playback using the Web Speech API
- Instant quiz feedback and per-lesson scoring
- Progress saved locally in the browser
- Installable Progressive Web App with offline caching
- Responsive, dependency-free design

## Run locally

The app has no build step. Because it loads JSON and registers a service worker, serve the directory over HTTP rather than opening `index.html` directly.

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## GitHub Pages

This repository is designed to deploy from the root of the `main` branch. Relative asset paths allow it to work at the project URL without configuration changes.

## Content

Lesson copy and quiz questions live in `content.json`. Each lesson contains metadata, phrases, and quiz entries, so new adventures can be added without changing the application logic.

## License

Use and adapt this educational starter for your own learning projects.
