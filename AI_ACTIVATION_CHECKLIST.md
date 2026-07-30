# Advanced AI Manual Activation Checklist

Advanced AI must remain disabled until every applicable item is reviewed and explicitly approved by the repository owner. Checking development tasks is not permission to activate production.

## Product readiness

- [ ] Free lessons, teacher animations, lesson engine, activities, saving, pause/resume, microphone permission handling, button fallback, offline operation, and synchronization pass end-to-end tests.
- [ ] Advanced AI remains optional and every failure preserves lesson state and progress.
- [ ] Child-facing safety, privacy, accessibility, and parent-control reviews are complete.

## Security readiness

- [ ] Backend design and code receive a security review.
- [ ] Firebase ID-token verification and child ownership checks have integration tests.
- [ ] App Check is configured and enforced after a monitored rollout.
- [ ] Origin validation, request-size limits, rate limits, duplicate detection, replay protection, and timeouts are verified.
- [ ] Logs contain no raw audio, full child transcripts, personal data, credentials, or authorization headers.
- [ ] Firestore rules and backend service-account permissions follow least privilege.

## Cost readiness

- [ ] Current official provider pricing is verified on the activation day.
- [ ] Daily and monthly estimates, alerts, and automatic shutdown are tested.
- [ ] Per-child, per-account, per-minute, per-lesson, input, output, and session limits are enforced server-side.
- [ ] Billing requires separate explicit owner approval.
- [ ] Increasing any prepared limit requires explicit owner approval.

## Secret and backend approval

- [ ] Explicit approval is given before creating any real provider request.
- [ ] Explicit approval is given before manually storing `OPENAI_API_KEY` in Firebase Secret Manager or an equivalent protected server environment.
- [ ] The secret is never pasted into Codex, chat, source code, GitHub, Firestore, documentation, logs, or frontend configuration.
- [ ] Explicit approval is given before deploying any AI function or paid backend resource.
- [ ] A rollback plan is tested before production deployment.

## Realtime and production approval

- [ ] Explicit approval is given before implementing or connecting realtime voice.
- [ ] Short-lived credentials are scoped, expire quickly, and never expose the permanent key.
- [ ] Explicit approval is given before changing `OPENAI_BACKEND_ENABLED`.
- [ ] Explicit approval is given before changing `ADVANCED_AI_ENABLED`.
- [ ] Explicit approval is given before changing `REALTIME_VOICE_ENABLED`.
- [ ] Explicit approval is given before allowing any production user.
- [ ] Parent consent and a working “return to free mode” control are verified.

## Release gate

- [ ] Repository-wide secret and forbidden-transport tests pass.
- [ ] Authentication, ownership, abuse, cost, fallback, privacy, and zero-duplicate-XP tests pass.
- [ ] A staged non-production environment is verified without child production data.
- [ ] The owner records final, explicit approval for the exact commit and deployment.

Until all approvals are recorded, the correct release state is:

```text
ADVANCED_AI_ENABLED=false
REALTIME_VOICE_ENABLED=false
OPENAI_BACKEND_ENABLED=false
Advanced AI: Not active
```
