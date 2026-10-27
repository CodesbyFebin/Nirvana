# Muse-Claw SDLC Flow (dry-run, JeV-gated)

Module: **Muse-Claw DevOps**. Status: **local vertical slice, dry-run only.**

An issue (title, description, optional `owner/repo`) runs through eight specialist stages in order.
Each stage receives the prior artifacts as context and emits one `SdlcStageArtifactV1` JSON artifact
(`contracts/SdlcStageArtifactV1.schema.json`, `stage` discriminator).

| # | Stage | Token Factory role | Output |
|---|-------|--------------------|--------|
| 1 | Planner | planner (Nemotron Ultra) | sub-tasks, estimates, acceptance criteria |
| 2 | Architect | planner (Nemotron Ultra) | decision record, file map, interface contracts |
| 3 | Coder | coder (Nemotron Super) | change plan — **not committed**; proposes apply-patch / commit / open-merge-request |
| 4 | Tester | coder (Nemotron Super) | proposed unit / integration / acceptance tests — **not run** |
| 5 | Security | router (Nemotron Lightning) | OWASP Top 10 / secrets / dependency checklist + proposed fixes; proposes apply-patch |
| 6 | Compliance | router (Nemotron Lightning) | GDPR / SOC 2 / HIPAA control-mapping **checklist — not certification** |
| 7 | Deployer | router (Nemotron Lightning) | CI validation notes, rollout + rollback plan; proposes deploy |
| 8 | GreenOps | router (Nemotron Lightning) | CI carbon **ESTIMATE** with explicit assumptions — never measured |

Model IDs come from `roleModelMap()` in `lib/nirvana/token-factory.mjs` and are `defaults_unverified`.

## Guarantees in this release
- **Dry-run.** `mode: "dry-run"` on every artifact. No inference call is made, with or without `NEBIUS_API_KEY`; no spend.
- **Fail-closed.** Each artifact is validated before handoff; a failure marks that stage `failed`, later stages `skipped`, the flow `halted`, and no evidence envelope is produced.
- **Hashed + chained.** Each artifact's SHA-256 digest is stored content-addressed and recorded in an `SDLC_STAGE_COMPLETED` audit event. Hashes are not signatures or ZK proofs.
- **JeV-gated proposals.** Every proposed commit / merge request / patch / deploy becomes a pending approval (ActionManifestV1: artifact digest + scope + nonce + 30-min expiry, destination `execution-blocked`). Approving records consent; nothing executes. **NO EXECUTION AUTHORIZED.**
- **Evidence.** A completed flow yields an EvidenceEnvelopeV1-compatible bundle with `verification_status: "pending"`, `verified_at: null`, and zero digests for `guest_image_id` / `receipt_artifact_digest` (no prover, no receipt).
- `measured: false` on every artifact. Estimates are labeled estimates.

No real commits, merge requests, patches, deploys, scans, or test runs happen.

## API (HTTP Basic + same-origin guard via `proxy.js`)
- `POST /api/nirvana/flows` `{ title, description, repo? }` → runs the dry-run flow, returns stages, artifacts, digests, approvals.
- `GET /api/nirvana/flows` → list + stage definitions.
- `GET /api/nirvana/flows/:id` → one flow.

Console: `/nirvana` → **SDLC Flow**.

Prior art: multi-agent SDLC flows (e.g. public hackathon projects).

## Token Factory connection (opt-in live stages)

Live inference runs **only** when both are set:

- `NEBIUS_API_KEY` (Token Factory key), and
- `NIRVANA_SDLC_INFERENCE=1` (explicit opt-in — this is spend).

Then `startFlowWithInference()` (used by `POST /api/nirvana/flows`) makes **at most one**
`chat.completions` call per stage, using the role map: Planner/Architect → Ultra,
Coder/Tester → Super, Security/Compliance/Deployer/GreenOps → Lightning.

| Stage `mode` | Meaning |
| --- | --- |
| `dry-run` | No key or no opt-in; deterministic template only, no network. |
| `live` | Template structure + live completion text in `body.inference.text`. |
| `dry-run-fallback` | Call failed / timed out (~20 s) / empty; template output, error recorded. |

Honesty rules:
- Only API-reported token usage is recorded (`body.inference.usage`, `source: api-reported`), else `null`. `measured` stays `false`; no latency/cost/quality claims.
- Live text is a proposal. Commit / MR / patch / deploy remain JeV approvals — **NO EXECUTION AUTHORIZED**.
- Tests mock `fetch`; no real network call runs in the suite.
