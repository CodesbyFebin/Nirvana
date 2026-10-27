# Implementation tasks
47 tasks. All start **not started**; a source file or plan is not evidence of passing. Ownership is a proposed engineering role, not an assignment to a named person.
Dependencies are conservative sequential gates. Celestia and physical hardware may be omitted only by explicitly reducing release scope and removing those claims. CPU execution and code-release proof binding are the critical path.

## G0 — Prototype integrity

### G0-01 · Fix secure-context and persistence errors
- Status: not started. Priority: P0. Owner: Application/Systems.
- Depends on: none.
- Build: Detect unavailable crypto/storage before mutation; make task+event write atomic and show actionable failure.
- Acceptance: Plain HTTP error, denied storage, quota failure and reload leave no partial tasks.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G0-02 · Serialize audit producers
- Status: not started. Priority: P0. Owner: Application/Systems.
- Depends on: G0-01.
- Build: Single event queue plus revision check; validate complete stored records.
- Acceptance: Concurrent torque/task events form one chain; corrupt nested records rejected.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G0-03 · Qualify console interactions
- Status: not started. Priority: P0. Owner: Application/Systems.
- Depends on: G0-02.
- Build: Test create/read/write scopes, approval/rejection, filters, export, reload, keyboard and mobile.
- Acceptance: Browser tests pass on localhost secure context; export recomputes chain; no fabricated cloud status.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

## G1 — Identity and durable control plane

### G1-01 · Bootstrap monorepo and contracts
- Status: not started. Priority: P0. Owner: Application/Systems.
- Depends on: G0-03.
- Build: Pin runtimes, lockfiles, contract generation, formatting and CI.
- Acceptance: Clean checkout builds; contract drift fails CI; secrets absent.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G1-02 · Implement OIDC workspace identity
- Status: not started. Priority: P0. Owner: Application/Systems.
- Depends on: G1-01.
- Build: Validate issuer/audience/expiry; server membership and role checks; protect cookie writes.
- Acceptance: Two-user tenant isolation, CSRF, logout and expiry tests pass.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G1-03 · Migrate PostgreSQL domain records
- Status: not started. Priority: P0. Owner: Application/Systems.
- Depends on: G1-02.
- Build: Create task revisions, events, approvals, artifacts, jobs and outbox with tenant constraints.
- Acceptance: Fresh migration and upgrade pass; foreign tenant IDs denied.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G1-04 · Replace localStorage task source
- Status: not started. Priority: P0. Owner: Application/Systems.
- Depends on: G1-03.
- Build: API-backed console with durable status and explicit empty/error/loading states.
- Acceptance: Two sessions see same task; disconnect/reconnect resumes ordered events.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

## G2 — Durable orchestration

### G2-01 · Implement transition engine
- Status: not started. Priority: P0. Owner: Application/Systems.
- Depends on: G1-04.
- Build: Versioned task states and immutable revisions; legal transitions only.
- Acceptance: Conflicting updates produce one winner; illegal transitions fail.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G2-02 · Implement outbox and leases
- Status: not started. Priority: P0. Owner: Application/Systems.
- Depends on: G2-01.
- Build: Transactional events, leased jobs, heartbeat, bounded attempts and dead letters.
- Acceptance: Kill worker/controller at boundaries; jobs recover without duplicate effects.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G2-03 · Implement cancellation and reconciliation
- Status: not started. Priority: P0. Owner: Application/Systems.
- Depends on: G2-02.
- Build: Persist cancel request, terminate worker, reconcile uncertain external actions.
- Acceptance: Cancel during queue/run/apply reports actual outcome and confirmed worker exit.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

## G3 — Authorization and spending

### G3-01 · Implement deterministic policy tiers
- Status: not started. Priority: P0. Owner: Security/Platform.
- Depends on: G2-03.
- Build: Map actions to reviewed policies; model recommendation cannot override.
- Acceptance: Prompt injection cannot elevate tool access or self-approve.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G3-02 · Implement action-bound approvals
- Status: not started. Priority: P0. Owner: Security/Platform.
- Depends on: G3-01.
- Build: Digest binds task revision, arguments, artifact, destination, policy, expiry, nonce and budget.
- Acceptance: Alter each field and replay/expire/revoke approval: all denied.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G3-03 · Implement execution-time capability gate
- Status: not started. Priority: P0. Owner: Security/Platform.
- Depends on: G3-02.
- Build: Check authorization again immediately before side effects; transactional nonce/idempotency handling.
- Acceptance: TOCTOU artifact swap and concurrent replay cannot execute changed/duplicate action.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G3-04 · Implement budget reservations
- Status: not started. Priority: P0. Owner: Security/Platform.
- Depends on: G3-03.
- Build: Per-workspace/task limits; reserve before work, settle observed usage and block unknown strict-free spend.
- Acceptance: Concurrent tasks cannot overspend; absent pricing/credits blocks strict-free mode.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

## G4 — Isolation and artifacts

### G4-01 · Qualify CPU Kata host
- Status: not started. Priority: P0. Owner: Security/Platform.
- Depends on: G3-04.
- Build: Prove virtualization support, runtime selection and actual microVM boundary on selected host.
- Acceptance: Retain host/runtime versions and isolation evidence; unsupported host marked blocked.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G4-02 · Build disposable job worker
- Status: not started. Priority: P0. Owner: Security/Platform.
- Depends on: G4-01.
- Build: No host socket/mounts/metadata; non-root, resource/time limits, deny-by-default network.
- Acceptance: Host path, metadata, cross-tenant network and resource exhaustion attacks blocked.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G4-03 · Implement scoped artifact service
- Status: not started. Priority: P0. Owner: Security/Platform.
- Depends on: G4-02.
- Build: Immutable content-addressed objects, size bounds and short-lived scoped access.
- Acceptance: Hash mismatch, foreign workspace object, expired token and overwritten object denied.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G4-04 · Execute real code-change fixture
- Status: not started. Priority: P0. Owner: Security/Platform.
- Depends on: G4-03.
- Build: Agent emits patch, locked dependencies, actual tests and complete exit/log artifacts.
- Acceptance: Fixture change builds/tests in isolated worker; intentionally broken change fails.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

## G5 — Inference and routing

### G5-01 · Discover Nebius capabilities
- Status: not started. Priority: P0. Owner: Application/Systems.
- Depends on: G4-04.
- Build: Authenticated model catalog plus separate bounded inference/tool/schema probes.
- Acceptance: Exact returned IDs captured; inaccessible/retired IDs fail closed.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G5-02 · Implement inference gateway
- Status: not started. Priority: P0. Owner: Application/Systems.
- Depends on: G5-01.
- Build: Logical roles, approved privacy class, deadlines, token caps, streamed cancellation and usage.
- Acceptance: Timeout/rate limit/provider outage paths bounded; no unauthorized fallback.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G5-03 · Evaluate Dragon Router
- Status: not started. Priority: P0. Owner: Application/Systems.
- Depends on: G5-02.
- Build: Representative labeled tasks; measure route quality, spend and escalation misses.
- Acceptance: Publish evaluation dataset/version and error metrics; no assumed 90/10 split.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G5-04 · Qualify private inference mode
- Status: not started. Priority: P0. Owner: Application/Systems.
- Depends on: G5-03.
- Build: Review service route, DNS, packet/log data flow, retention and region controls.
- Acceptance: Private mode enabled only with retained network and data handling evidence.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

## G6 — Tools and coding agent

### G6-01 · Implement MCP registry
- Status: not started. Priority: P0. Owner: Application/Systems.
- Depends on: G5-04.
- Build: Standards-compatible transport, reviewed schemas, pinned tool identities and capability mapping.
- Acceptance: Unknown tool/changed schema denied; protocol interop tests pass.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G6-02 · Implement bounded coding workflow
- Status: not started. Priority: P0. Owner: Application/Systems.
- Depends on: G6-01.
- Build: Plan, patch and test within task grant; tool output always untrusted.
- Acceptance: Malicious repo/tool text cannot read secrets, broaden targets or approve action.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G6-03 · Implement staging deploy adapter
- Status: not started. Priority: P0. Owner: Application/Systems.
- Depends on: G6-02.
- Build: Deploy application artifacts to approved container target, not a generic model endpoint.
- Acceptance: Target digest observed; repeated idempotency key returns same action.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

## G7 — Proof boundary

### G7-01 · Specify bounded guest predicates
- Status: not started. Priority: P0. Owner: Application/Systems.
- Depends on: G6-03.
- Build: Publish canonical manifest schema, explicit trusted inputs and expected journal semantics.
- Acceptance: Positive/negative vectors cover each predicate; claims exclude unexecuted tests.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G7-02 · Implement real guest and host
- Status: not started. Priority: P0. Owner: Application/Systems.
- Depends on: G7-01.
- Build: Pinned Rust guest image; deterministic bounded checks; production proof mode.
- Acceptance: Real receipt generated; guest source/image provenance retained; no dev receipt accepted.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G7-03 · Implement independent verifier
- Status: not started. Priority: P0. Owner: Application/Systems.
- Depends on: G7-02.
- Build: Pin image ID; verify seal, decode journal and compare all action commitments.
- Acceptance: Forged/truncated/wrong-image/wrong-action/dev/fail-result receipts rejected.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G7-04 · Benchmark proving jobs
- Status: not started. Priority: P0. Owner: Application/Systems.
- Depends on: G7-03.
- Build: Async job statuses, resource caps, cancellation and hardware/cycle timing evidence.
- Acceptance: Observed duration distributions and failure paths; no hardcoded timing claims.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

## G8 — Evidence-bound release

### G8-01 · Implement signed audit envelopes
- Status: not started. Priority: P0. Owner: Application/Systems.
- Depends on: G7-04.
- Build: Canonical tenant sequence, signatures, key rotation and independent export verification.
- Acceptance: Mutation, truncation against external checkpoint, reorder and wrong signer detected.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G8-02 · Bind verifier to execution gate
- Status: not started. Priority: P0. Owner: Application/Systems.
- Depends on: G8-01.
- Build: Verify artifact/policy/action match before accepting approval and applying stage release.
- Acceptance: Old valid receipt cannot authorize modified artifact or different destination.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G8-03 · Run complete staging vertical slice
- Status: not started. Priority: P0. Owner: Application/Systems.
- Depends on: G8-02.
- Build: Real inference, isolated code execution, checks, receipt, approval and observed deployment.
- Acceptance: One evidence bundle links source commit through final observed target digest.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

## G9 — Memory and privacy

### G9-01 · Implement encrypted memory store
- Status: not started. Priority: P1. Owner: Application/Systems.
- Depends on: G8-03.
- Build: Workspace keys, provenance, retention, embeddings and deletion handling.
- Acceptance: Key rotation and deletion tests cover source, vectors and derived summaries.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G9-02 · Implement task-bound retrieval grants
- Status: not started. Priority: P1. Owner: Application/Systems.
- Depends on: G9-01.
- Build: Subject/task revision/purpose/scope/expiry; prequery and postquery checks.
- Acceptance: Cross-tenant, expired, revoked, deleted and purpose-mismatched retrieval denied.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G9-03 · Evaluate redaction and injection
- Status: not started. Priority: P1. Owner: Application/Systems.
- Depends on: G9-02.
- Build: Leakage corpus and hostile memory prompts; minimize inference inputs.
- Acceptance: Report false negatives/positives; no absolute zero-PII claim.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

## G10 — Physical AI

### G10-01 · Integrate deterministic simulator adapter
- Status: not started. Priority: P1. Owner: Application/Systems.
- Depends on: G9-03.
- Build: Pin world, policy, seed, timestep and actual sensor/constraint outputs.
- Acceptance: Replay reproduces run within documented tolerance; synthetic data clearly labeled.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G10-02 · Define safety manifest and checks
- Status: not started. Priority: P1. Owner: Application/Systems.
- Depends on: G10-01.
- Build: Bound policy digest, model/calibration, torque/velocity/joint limits and permitted environment.
- Acceptance: Boundary and invalid sensor cases fail; proof assumptions explicitly documented.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G10-03 · Implement signed OTA staging
- Status: not started. Priority: P1. Owner: Application/Systems.
- Depends on: G10-02.
- Build: Device identity, signature, expiry, monotonic release counter and rollback digest.
- Acceptance: Forged/expired/replayed/incompatible releases rejected; rollback exercised.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G10-04 · Qualify hardware safety independently
- Status: not started. Priority: P1. Owner: Application/Systems.
- Depends on: G10-03.
- Build: Physical emergency stop, independent limit controller, communication loss and HIL.
- Acceptance: Observed hardware tests pass before enabled physical actions; no remote proof safety dependency.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

## G11 — Optional public commitment

### G11-01 · Implement consented Celestia adapter
- Status: not started. Priority: P1. Owner: Application/Systems.
- Depends on: G10-04.
- Build: Use qualified current blob API; publish minimal non-sensitive commitments only.
- Acceptance: Opt-out prevents all submission; payload inspection excludes raw memory/secrets.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G11-02 · Verify submission inclusion
- Status: not started. Priority: P1. Owner: Application/Systems.
- Depends on: G11-01.
- Build: Track namespace/height/transaction and independently verify inclusion with failure/reorg policy.
- Acceptance: Broadcast alone remains pending; valid inclusion linked to local evidence; fees bounded.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

## G12 — Sovereign deployment and release

### G12-01 · Prepare reviewed Nebius IaC
- Status: not started. Priority: P1. Owner: Security/Platform.
- Depends on: G11-02.
- Build: Qualified products/region, private service identities, firewall and secret injection.
- Acceptance: Recreate staging from clean account config; no unexpected public services.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G12-02 · Migrate UI and complete data-flow inventory
- Status: not started. Priority: P1. Owner: Security/Platform.
- Depends on: G12-01.
- Build: Self-host assets; inventory DNS/CDN/inference/logs/backups/support and egress.
- Acceptance: Sovereignty claims match measured boundaries; no external font/analytics requests.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G12-03 · Implement telemetry and incident controls
- Status: not started. Priority: P1. Owner: Security/Platform.
- Depends on: G12-02.
- Build: Safe logs, alerts, emergency pause, credential revocation and artifact retention.
- Acceptance: Leak sentinel never appears in logs; emergency pause blocks new external actions.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G12-04 · Execute recovery and load drills
- Status: not started. Priority: P1. Owner: Security/Platform.
- Depends on: G12-03.
- Build: Backup restore, queue replay, uncertain action reconciliation and bounded concurrency.
- Acceptance: Measure RPO/RTO and p95 latency with workload/hardware stated; no duplicate writes.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G12-05 · Complete independent security review
- Status: not started. Priority: P1. Owner: Security/Platform.
- Depends on: G12-04.
- Build: External reviewer assesses auth, isolation, proof binding, privacy and device boundary.
- Acceptance: Critical/high findings resolved and retested; review report linked to release commit.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.

### G12-06 · Produce release evidence and demo
- Status: not started. Priority: P1. Owner: Security/Platform.
- Depends on: G12-05.
- Build: Pin all evidence to final commit and disclose unpassed tracks.
- Acceptance: 100-point rubric assessed only from executed evidence; all mandatory gates pass.
- Required evidence: commit, executed procedure, environment versions, timestamp, raw result and artifact digests.
