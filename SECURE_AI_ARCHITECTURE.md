# Secure AI Architecture

## Current status

Advanced AI is not active. The production application always creates `FreeConversationProvider`. The mock provider is deterministic and local. `AdvancedConversationProvider` is a disabled placeholder that throws `DisabledProviderError`.

The three release flags are immutable and `false`:

```text
ADVANCED_AI_ENABLED=false
REALTIME_VOICE_ENABLED=false
OPENAI_BACKEND_ENABLED=false
```

There is no OpenAI SDK, provider URL, permanent key binding, realtime connection, or paid request in the shipped code. The prepared Firebase functions must not be deployed before the activation checklist is approved.

## Future trust boundary

```text
GitHub Pages frontend
  -> Firebase Authentication ID token
  -> Firebase App Check token (when enforced)
  -> disabled Firebase backend interface
  -> future provider adapter (not implemented)
```

GitHub Pages is public. Any value included in HTML, JavaScript, source maps, browser storage, or a network response can be inspected by a visitor. A permanent provider key can therefore never be stored in the frontend or Firebase public client configuration.

If approved in the future, the permanent key named `OPENAI_API_KEY` must be entered manually in Firebase Secret Manager or an equivalent protected server environment. It must never be pasted into Codex, chat, GitHub, documentation, tests, logs, Firestore, or frontend configuration.

## Provider boundary

`ConversationProvider` defines:

- `startSession(context)`
- `processUtterance(input, context)`
- `interrupt()`
- `reset()`
- `endSession()`

`FreeConversationProvider` is the only production provider. It uses deterministic lesson rules, browser speech synthesis, optional browser speech recognition, and button fallbacks. It makes no network request.

`MockAdvancedConversationProvider` simulates advanced scenarios for development and automated tests. It is deterministic and reports zero paid requests.

`AdvancedConversationProvider` contains no provider transport. Calling it throws a clear disabled-provider error. `startSessionWithFallback` preserves the same lesson context and immediately starts the free provider.

## Prepared backend interfaces

The disabled Firebase layer exposes interface names for:

- `createConversationSession`
- `processConversationTurn`
- `endConversationSession`
- `getRealtimeClientCredential`

Every interface validates origin, HTTP method, request size, Firebase ID token, optional App Check, child-profile ownership, input bounds, duplicates, replays, and limits. Every valid call still returns `advanced-ai-disabled`, a null credential, and `paidRequests: 0`.

The future realtime flow may only be implemented after approval:

1. The authenticated browser requests a short-lived credential.
2. The backend verifies identity, child ownership, consent, flags, App Check, rate limits, and budgets.
3. Only the backend reads the permanent secret.
4. The backend requests a tightly scoped, short-lived credential.
5. The browser receives only that expiring credential.
6. The permanent key never enters a browser response.

## Abuse and cost controls

The prepared defaults are intentionally restrictive:

- 5 AI minutes per child per day
- 10 AI minutes per account per day
- 3 requests per minute
- 12 requests per lesson
- 1,200 input characters
- 700 requested output units
- 12 KB request body
- 10-minute session
- USD 0.50 estimated daily ceiling
- USD 5 estimated monthly ceiling

Requests are rejected on duplicate request IDs, reused nonces, malformed identifiers, raw-audio fields, excessive size, or any limit. These checks complement authentication; a hidden URL is never treated as security.

## Usage and privacy

The prepared usage record contains only parent ID, child-profile ID, lesson ID, session ID, bounded unit counts, audio durations, estimated cost, timestamp, and status. It does not accept raw audio or full transcripts.

Raw answer recordings remain in browser memory only when the parent has consented to immediate playback. They are cleared when the question changes, the child changes, the lesson ends, or the page unloads. Microphone and speech recognition are stopped on pause, exit, and interruption.

Transcript retention remains disabled. A future implementation must minimize context, avoid sensitive child data, redact logs, separate account and child identifiers where possible, and provide deletion controls.

## Failure behavior

Disabled flags, offline Firebase, expired authentication, App Check failure, rate limits, timeout, backend failure, or provider exceptions must all leave the current lesson context intact and return control to `FreeConversationProvider`. Child-facing messages remain friendly and technical details appear only in developer diagnostics.

Daily completion and XP continue through the existing deterministic, idempotent progress path. Provider fallback cannot award additional XP.

## Future activation

No single flag may activate the feature. Activation requires all three release flags, a production build, deployed and reviewed backend, server-side secret, verified pricing, parent consent, App Check, cost limits, short-lived credentials, monitoring, security tests, and explicit owner approval. Follow `AI_ACTIVATION_CHECKLIST.md`.
