# Scale and Serve JAX Models on NVIDIA GPUs (Nebius)

> **NOT VERIFIED ON THIS ACCOUNT.** No Nebius cluster was provisioned from this repo.
> No terraform apply, no GPU spend, no live model register. All gates below start **pending**.
> Nebius remains **Unconnected / Planned** in the Nirvana connection registry until
> `NEBIUS_INFERENCE_API_URL` is set **and** a read-only probe of `GET /v1/models` succeeds.
> JeV / `--mev` gatekeeper stays **NO EXECUTION AUTHORIZED**.

> **Sibling path:** Managed Nemotron chat/completions live on **Nebius Token Factory**
> (OpenAI-compatible), not on this k8s-inference fleet. See `docs/nirvana/TOKEN-FACTORY.md`
> and https://github.com/nebius/token-factory-cookbook. This document covers **custom**
> JAX/Triton/MaxText containers on the self-operated GPU fleet only.

Upstream source of truth (do not vendor the Terraform tree into Nirvana):

- https://github.com/nebius/nebius-solutions-library
- Inference fleet: `k8s-inference/` (multi-region GPU platform; models = any container via `POST /v1/models`)
- Training cluster: `k8s-training/` (GPU-Operator + Network-Operator / InfiniBand)
- GPU sharing: `gpu_slicing/` (MIG / MPS / timeslice)

The platform ships **no models**. Built-in job classes are only `hello-run`, `container-run`,
and `distributed-run`. The acceptance probe example uses `vllm/vllm-openai` + SmolLM — that is
**not** JAX. JAX packaging is an operator choice (see below).

## How Nirvana maps Muse-Claw / Dragon Router to Nebius

| Nirvana module | Intended Nebius surface | Status in this build |
|---|---|---|
| Muse-Claw DevOps (coding agents) | Sync HTTP serve for light codegen / tool-call models; MaxText Jobs for heavier train/eval | Planned |
| Dragon Router (difficulty / cost routing) | Cheap Nano-class endpoint on Serverless AI *or* a small Triton/JAX (or vLLM) endpoint on the fleet | Planned |
| JeV Gatekeeper risk assessment | Ultra-class reasoning endpoint — still advisory; approvals stay local and fail-closed | Planned / no live authorize |
| zkVM proving / Celestia | Nebius Serverless Jobs (async) — out of scope for this JAX path doc | Planned |

Two Nebius shapes (from the upstream `k8s-inference` README tradeoff table):

| Question | Nebius Serverless AI (managed) | k8s-inference fleet (self-operated) |
|---|---|---|
| Time to first call | Minutes | ~45 minutes, then minutes per model |
| What runs | Always-on containers, scale-to-zero HTTP | Same endpoints **plus** queued calls, checkpointed long Jobs, multi-node InfiniBand |
| Who operates | Nebius | Your platform team (Grafana/Prometheus/Loki/OpenCost included) |
| Pick when | One or a few models, no desire to run K8s | Multi-tenant platform, batch + online, placement / reserved / private net |

Nirvana's fail-closed adapter (`lib/nirvana/nebius-inference.mjs`) speaks the **fleet API**
shape (`GET /v1/models`). The same env knobs can point at a managed Serverless AI base URL
once the operator confirms its health path — still probe-only, never spend.

## Operator outline (no cloud apply from this repo)

1. Clone upstream: `git clone https://github.com/nebius/nebius-solutions-library.git`
2. Work inside `nebius-solutions-library/k8s-inference/` (not inside Nirvana).
3. Copy knobs from this repo's `deploy/nebius/terraform.tfvars.nirvana.example` into a real
   `terraform.tfvars` in that checkout. Fill project IDs, regions, H100 pool, `protect_data`.
4. Follow upstream README / `./stack.sh` to plan → apply → print control API URL and tenant keys
   (`./stack.sh output platform control`). **Do not run apply from Nirvana.**
5. Register models afterwards with `POST /v1/models` (admin key). Example bodies live in
   `deploy/nebius/models/*.example.json`. Pin image digests you built; do not trust `:latest`.
6. Point Nirvana at the control API:
   ```bash
   export NEBIUS_INFERENCE_API_URL=https://api.<control-host>   # no trailing slash required
   export NEBIUS_INFERENCE_API_KEY=sk-...                       # tenant key; never commit
   ```
7. Confirm `/api/nirvana/status` shows `nebius-inference` as **Connected** only after probe.
   Registering a JSON example locally does **not** call Nebius. A future “qualify” path that
   POSTs models must be JeV-gated and is **not** in this PR.

Related paths in the same library (document only): `k8s-training/` for multi-node MaxText
training clusters; `gpu_slicing/` when sharing one H100 across several small endpoints.

## JAX packaging choices (NVIDIA GPUs)

| Path | Container / runtime | Nebius mode | Use when |
|---|---|---|---|
| **Triton + JAX Python backend** | Operator-built image with NVIDIA Triton Inference Server + JAX backend (placeholder in `jax-triton.example.json`) | `kind: endpoint`, `protocol: http`, port 8000, scale-to-zero | Sync HTTP serve for Muse-Claw / Dragon Router |
| **MaxText / NVIDIA JAX Toolbox** | `ghcr.io/nvidia/jax:maxtext` (or a digest-pinned fork) as a `container-run` / `mode: run` Job | Long Job with checkpoints; prefer H100 class | Scale train / eval / batch inference |
| **JetStream** | Primarily a **TPU** serving path | **Out of scope** for the Nebius NVIDIA GPU path | Do not select for H100/A100 fleets here |

Acceptance probe in upstream uses vLLM — fine for smoke; replace with the JAX images above
for Muse-Claw / Dragon Router JAX workloads.

## Qualification checklist (all gates start **pending**)

| Gate | Intent | State |
|---|---|---|
| GPU class | Prefer `h100` (fallback `a100` / `l40s` only if image supports the SM) | **pending** |
| Image digest pin | Replace placeholders with `repo@sha256:…` the operator built | **pending** |
| Health / readiness path | Triton HTTP ready; MaxText Job exit + artifact upload | **pending** |
| Scale-to-zero | `scaling.min: 0` on endpoints; idle GPU pools scale down | **pending** |
| Budget key | Tenant API key with USD / GPU-second budget; OpenCost visible | **pending** |
| Cold start | Image cache / Spegel / warm_nodes per upstream docs | **pending** |
| Probe from Nirvana | `NEBIUS_INFERENCE_API_URL` + successful `GET /v1/models` | **pending** |
| JeV qualify path | Explicit human-gated model register (not in this PR) | **pending** |

## Honesty

- No fabricated GPU telemetry, no fake `VERIFIED` zkVM claims, no invented model catalog.
- Local examples under `deploy/nebius/` are **templates**, not applied infrastructure.
- Cloud execution and production readiness remain **unverified**.

## Related: Token Factory vs this fleet

Nirvana uses **both** as separate Planned connections:

- **Token Factory** (`nebius-token-factory`) — managed Nemotron Ultra / Super / Lightning for
  planner / coder / router roles. Cookbook: https://github.com/nebius/token-factory-cookbook
  · Nirvana doc: `docs/nirvana/TOKEN-FACTORY.md` · env `NEBIUS_API_KEY`.
- **This fleet** (`nebius-inference`) — custom JAX / Triton / MaxText containers via
  solutions-library `k8s-inference/`. Env `NEBIUS_INFERENCE_API_URL`.

Do not point Token Factory credentials at the fleet probe, or vice versa.

