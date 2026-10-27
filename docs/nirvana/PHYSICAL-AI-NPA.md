# Nirvana × Nebius Physical AI (NPA Workbench) — Edge-Sentinel Bridge

> **Honesty banner:** Sim-only / hardware-gated. Connection `nebius-physical-ai` is **Unconnected / Planned**.
> Nirvana does **not** launch NPA jobs, submit SkyPilot runs, provision GPUs/storage, or run robot policies.
> JeV gate: **NO EXECUTION AUTHORIZED.** No telemetry, benchmarks, or rollouts are claimed.

Source of truth: <https://github.com/nebius/nebius-physical-ai> (Apache-2.0, Python 3.11+).

## What NPA is (per upstream README)
"Workbench is NPA's agent control plane for Physical AI on Nebius AI Cloud, covering infrastructure setup and
management, simulation, robot policy training, synthetic data, and evaluation." Its workflow engine plans
execution waves, submits them through **SkyPilot** to **Nebius Kubernetes**, uses S3 artifacts / durable run
state in **Object Storage**, and runs public **GHCR** images (`ghcr.io/nebius/nebius-physical-ai`).
**Token Factory** is a separate hosted inference API that workflow stages may call.

## Mapping onto Nirvana
| NPA concept | Nirvana module | Status |
|---|---|---|
| Simulation / sim2real workflows | Edge-Sentinel Bridge (Physical AI track) | concept, sim-only |
| Robot policy training (e.g. GR00T fine-tune) | Edge-Sentinel Bridge | concept, hardware-gated |
| Synthetic data (Cosmos) | Edge-Sentinel Bridge | concept |
| Evaluation / artifacts | Evidence envelope (planned linkage) | concept |
| Token Factory inference | `nebius-token-factory` row | see TOKEN-FACTORY.md |

Contrast: **ConTree** = agent code sandboxes; **Token Factory** = managed Nemotron; **NPA** = GPU workflow control plane.

## Install / CLI (copied from upstream README — operator runs these, not Nirvana)
```bash
git clone https://github.com/nebius/nebius-physical-ai.git
cd nebius-physical-ai
python3 -m venv .venv
source .venv/bin/activate
pip install -e npa
npa --version
```
Connect a project (upstream):
```bash
curl -fsSL https://storage.eu-north1.nebius.cloud/cli/install.sh \
  | NEBIUS_CLI_VERSION=0.12.254 bash
export PATH="${HOME}/.nebius/bin:${PATH}"
npa configure            # provisions object storage by default; use --no-provision to avoid
npa workbench health preflight --checks nebius --json
```
Note upstream: interactive `npa configure` provisions object storage by default — needs explicit user approval.

## Nirvana adapter (`lib/nirvana/physical-ai.mjs`)
- Env (optional flags only, Nirvana-defined, not upstream): `NPA_ENABLED`, `NEBIUS_PHYSICAL_AI_HOME`.
- `status()` → always `connected:false`, "Sim-only / hardware-gated — Unconnected / Planned".
- `probe()` → read-only `fs.stat` for `$NEBIUS_PHYSICAL_AI_HOME/.venv/bin/npa` or `npa/pyproject.toml`. Never executes `npa`; never connected.
- `capabilities()` → simulation, policy training, synthetic data, evaluation, SkyPilot workflows — all labeled `concept`.

See `deploy/nebius/physical-ai/` for a commented, non-executing workflow stub.
