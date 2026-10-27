# Nirvana — Sovereign Verifiable AI Cloud

**Tagline (positioning only):** "Build with NVIDIA. Verify with RISC Zero. Own on Nebius."

**Delivery status:** local full-stack vertical slice inside this Open Web LLM / MetaPen repo.
Cloud integrations (Nebius endpoints/jobs, NVIDIA Nemotron catalog IDs, RISC Zero receipts,
Celestia, robots, encrypted memory TBAC) remain **Planned / not configured / unverified**.
Do not treat UI labels as live telemetry, proofs, or production authorization.

## What Nirvana is

A governed task-execution platform: a user submits a bounded objective; a workflow plans;
a policy gateway restricts tools; people approve high-impact changes; workers execute in
isolation; an evidence service records what ran. A RISC Zero guest is intended (later) to
prove selected deterministic checks over committed artifacts.

The **first usable product is one vertical slice** — durable task + approval binding +
honest evidence — not four finished products and not GPU provisioning.

## Four tracks (modules)

| Track | Module | Status in this build |
|---|---|---|
| Coding & Agentic Engineering | **Muse-Claw DevOps** | Task intake + scope classification; coding runtime **not connected** |
| Best Apps & Agents | **Dragon Router + JeV / --mev Gatekeeper** | Local deterministic scope policy + MetaPen 10-claw swarm console (concept counts); external execution **blocked** |
| Personal AI | **Sentinel-Memory Vault** | Read-only “not connected” registry; no TBAC/encryption yet |
| Physical AI | **Edge-Sentinel Bridge** | Scalar torque-limit check only; simulation/hardware **disabled** |

**MetaPen** (`/metapen`) is the security / swarm operator layer inside Nirvana
(10 claws × 50 tool slots = 500-agent concept target). Its sandbox concept maps to
**ConTree** (Nebius Early Access: VM-isolated, git-like branch/rollback) — see
[`docs/nirvana/CONTREE-SANDBOX.md`](docs/nirvana/CONTREE-SANDBOX.md). Kali / Kata-on-Nebius /
zkVM remain *planned* separately (Kata = self-operated GPU fleet; ConTree = managed sandbox API).
**JeV: Nirvana does not execute in ConTree yet.**

## Execution / sandbox plane

| Surface | Role | Status |
|---|---|---|
| **ConTree** (sdk / cli / mcp) | Managed VM-isolated branching sandboxes; MCP tool gateway | Early Access — Unconnected / Planned ([CONTREE-SANDBOX.md](docs/nirvana/CONTREE-SANDBOX.md)) |
| Kata / Nebius k8s-inference | Self-operated GPU fleet jobs (JAX/Triton etc.) | Unconnected / Planned ([JAX-NVIDIA-NEBIUS.md](docs/nirvana/JAX-NVIDIA-NEBIUS.md)) |

**JeV / --mev:** external execution remains **NO EXECUTION AUTHORIZED**. ConTree wiring in this
repo is status/probe + docs only.

## Honesty rules

- Model names: **Muse Code** (light + planning), **Muse Wonder / Wonder Full** (reasoning via Muse Code), **Graph Engine** (graph tier — not “Libra”).
- Pipeline stages: Perception → Reasoning → **Report** → Action.
- Approval gate: **JeV / --mev**. Approvals are durable server records that bind an immutable
  ActionManifest digest + scope + nonce + expiry. They **do not** authorize live deployment
  or tool execution in this build (`NO EXECUTION AUTHORIZED`).
- SHA-256 audit links are hashes, **not** signatures or ZK proofs.
- Agent/tool counts (500 / 32 / 468 …) are **concept / target**, not live telemetry.
- ProofJournal / EvidenceEnvelope `verification_status: "verified"` fields are schema
  vocabulary only; no live prover is connected.

## What this repo implements now (G0 + G1 spine)

- Authenticated (HTTP Basic) control API under `/api/nirvana/**`
- Durable SQLite domain records: tasks (immutable revisions), append-only audit hash chain
  (single-writer `BEGIN IMMEDIATE`), approvals bound to ActionManifest digests, artifacts
- Contracts in `contracts/` (ActionManifestV1, ProofJournalV1, EvidenceEnvelopeV1)
- Operator console at `/nirvana` (four-track shell) + existing `/metapen` swarm center
- Fail-closed same-origin guard on mutating `/api/*` (see `lib/same-origin.mjs`)
- Secure-context / crypto precheck fails **before** state mutation
- External actions remain blocked

Full design, gap register, 47 tasks, and 100-point **target** rubric (not a score):

- `docs/nirvana/MASTER-BLUEPRINT.md`
- `docs/nirvana/CURRENT-STATE.md`
- `docs/nirvana/IMPLEMENTATION-TASKS.md` (+ `docs/nirvana/implementation-tasks.json`)
- `docs/nirvana/ACCEPTANCE.md`
- `docs/nirvana/DEMO-RUNBOOK.md`

## Local run (Node 24 required)

```bash
export PATH=/home/box/.local/node-v24.11.0-linux-x64/bin:$PATH
node -v   # must be v24.x
cd /workspace/Jules-Claw
# .env.local already has OPEN_JULES_USERNAME / OPEN_JULES_PASSWORD for preview
npm run build && npm start
# open http://127.0.0.1:3000/nirvana  (Basic auth: admin / preview_password_123456)
# MetaPen swarm: http://127.0.0.1:3000/metapen
npm test
```

Nirvana SQLite store defaults to `.jules-state/nirvana.sqlite` (override with `NIRVANA_DB_PATH`).

## Nebius GPU inference (Planned)

Scale / serve path for JAX on **NVIDIA GPUs** is grounded in the official Nebius Solution
Library — especially [`k8s-inference/`](https://github.com/nebius/nebius-solutions-library/tree/main/k8s-inference)
(Terraform/Helm fleet; models are any container via `POST /v1/models`; platform ships none).
Training and GPU sharing live in `k8s-training/` and `gpu_slicing/` of the same library.

Nirvana packaging choices (operator-built, digest-pinned):

1. **Triton Inference Server + JAX Python backend** — sync HTTP endpoint (`kind: endpoint`)
2. **NVIDIA JAX Toolbox / MaxText** (`ghcr.io/nvidia/jax:maxtext`) — long `container-run` Jobs  
JetStream is primarily TPU and is **out of scope** for the Nebius NVIDIA path.

Docs and stubs (no cloud apply from this repo):

- `docs/nirvana/JAX-NVIDIA-NEBIUS.md` — runbook, Serverless AI vs fleet tradeoff, qualification checklist (all gates **pending**)
- `deploy/nebius/` — README + example `POST /v1/models` bodies + `terraform.tfvars.nirvana.example`
- `lib/nirvana/nebius-inference.mjs` — fail-closed **status/probe only** (`GET /v1/models`); Connected only when probe succeeds

Env (optional, never commit secrets): `NEBIUS_INFERENCE_API_URL`, `NEBIUS_INFERENCE_API_KEY`.

## Nebius Token Factory — Nemotron roles (Planned / probe-only)

Managed **OpenAI-compatible** inference for planner / coder / router roles. Distinct from the
k8s-inference GPU fleet above (custom JAX/Triton containers).

| Role | Logical default model ID | Status |
|---|---|---|
| planner (Brain) | `nvidia/Nemotron-3-Ultra-550b-a55b` | defaults_unverified until probe |
| coder (Hands) | `nvidia/nemotron-3-super-120b-a12b` | defaults_unverified until probe |
| router (Reflexes) | `nvidia/Nemotron-3_5-Lightning` | defaults_unverified until probe |

- Cookbook: https://github.com/nebius/token-factory-cookbook
- Doc: `docs/nirvana/TOKEN-FACTORY.md`
- Adapter: `lib/nirvana/token-factory.mjs` — **GET /models only**; no `chat.completions` (no spend)
- Env: `NEBIUS_API_KEY` (required), optional `NEBIUS_TOKEN_FACTORY_BASE_URL`
  (default `https://api.tokenfactory.us-central1.nebius.com/v1/`)
- Catalog rule: list models → map roles → **abort if configured ID missing** (no silent fallback)

## Still Planned / unimplemented

Token Factory chat/completions spend + serverless jobs · live Nemotron invoke (probe/list only today) · RISC Zero
guest/host · independent verifier · Celestia DA · Kata GPU workers · MCP tool gateway ·
encrypted TBAC memory · robot / simulator / OTA · OIDC multi-user tenancy · outbox /
durable workflow controller · production deploy adapter.
