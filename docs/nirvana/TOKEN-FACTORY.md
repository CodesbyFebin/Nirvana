# Nebius Token Factory — Nemotron role map (Nirvana)

> **NOT VERIFIED ON THIS ACCOUNT.** No Token Factory inference call was made from this repo.
> No `chat.completions`, no spend, no billing. Connected only after `NEBIUS_API_KEY` is set
> **and** a read-only `GET {base}/models` probe succeeds. JeV stays **NO EXECUTION AUTHORIZED**.

Upstream source of truth (do **not** vendor notebooks into Nirvana):

- Cookbook: https://github.com/nebius/token-factory-cookbook
- Signup / API keys: https://tokenfactory.nebius.com
- Docs quickstart: https://docs.tokenfactory.nebius.com//inference/quickstart
- Start-here setup: `start-here/setup.md` in the cookbook (`NEBIUS_API_KEY`)
- Related cookbook areas (link only): `agents/`, `rag/`, `evaluations/`

## Two Nebius surfaces (do not conflate)

| Surface | What it is | Nirvana adapter | Env |
|---|---|---|---|
| **Token Factory** | Managed **OpenAI-compatible** inference (Nemotron chat/completions, embeddings, …) | `lib/nirvana/token-factory.mjs` · connection id `nebius-token-factory` | `NEBIUS_API_KEY`, optional `NEBIUS_TOKEN_FACTORY_BASE_URL` |
| **k8s-inference fleet** | Self-operated GPU platform; models = **any container** (`POST /v1/models`) for custom JAX / Triton | `lib/nirvana/nebius-inference.mjs` · id `nebius-inference` | `NEBIUS_INFERENCE_API_URL`, `NEBIUS_INFERENCE_API_KEY` |

See also: `docs/nirvana/JAX-NVIDIA-NEBIUS.md` (fleet / MaxText / Triton) and
https://github.com/nebius/nebius-solutions-library (`k8s-inference/`).

## Role → Nemotron map (LOGICAL defaults)

Catalog IDs change. These are **defaults to discover**, copied from cookbook model pages /
README table casing. After probe: map roles to observed IDs; **abort if a configured ID is
missing — no silent fallback**.

| Nirvana role | Module | Logical model ID | Cookbook ref |
|---|---|---|---|
| **planner** (Brain) | Muse Wonder / JeV risk assessment | `nvidia/Nemotron-3-Ultra-550b-a55b` | `models/nemotron/nemotron3-ultra-550b-a55b.md` |
| **coder** (Hands) | Muse-Claw DevOps code gen / tool calling | `nvidia/nemotron-3-super-120b-a12b` | `models/nemotron/nemotron3-super-120B.md` |
| **router** (Reflexes) | Dragon Router difficulty / intent | `nvidia/Nemotron-3_5-Lightning` | `models/nemotron/README.md` Lightning row |

`roleModelMap()` in the adapter returns these labeled `defaults_unverified` until a probe
confirms presence (or marks `missing_from_catalog`).

## Setup (from cookbook start-here)

1. Create an API key at https://tokenfactory.nebius.com (profile → API Keys).
2. Export locally (never commit):
   ```bash
   export NEBIUS_API_KEY=...          # required for Connected
   # optional override (default below):
   # export NEBIUS_TOKEN_FACTORY_BASE_URL=https://api.tokenfactory.us-central1.nebius.com/v1/
   ```
3. Confirm `/api/nirvana/status` shows `nebius-token-factory` **Connected** only after probe.
4. Do **not** call chat from Nirvana until a JeV-gated qualify path exists (not in this PR).

Default base URL (from Nemotron Ultra guide in the cookbook):

```
https://api.tokenfactory.us-central1.nebius.com/v1/
```

## OpenAI client example (operator local only — not wired into Nirvana)

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url="https://api.tokenfactory.us-central1.nebius.com/v1/",
    api_key=os.environ["NEBIUS_API_KEY"],
)

# LIST ONLY from Nirvana's adapter. Example chat below is for operators outside this repo:
# response = client.chat.completions.create(
#     model="nvidia/Nemotron-3-Ultra-550b-a55b",
#     messages=[{"role": "user", "content": "Explain quantum computing in one sentence."}],
# )
models = client.models.list()
print([m.id for m in models.data][:20])
```

## Catalog discovery rule

1. `GET {base}/models` with `Authorization: Bearer $NEBIUS_API_KEY`.
2. Build the set of observed model IDs.
3. For each role in `ROLE_DEFAULTS`, require `modelId ∈ catalog` (or confirm via a full list
   if the sample is truncated).
4. If any **configured** ID is missing → **abort** that role's use. Never silently substitute
   another model.

## Cost / budget notes

- Ultra is the expensive planner tier; Lightning is the cheap router/reflex tier; Super sits
  between for code. Prefer Nano/Lightning for high-QPS routing; reserve Ultra for the critical
  path (matches Nirvana's Dragon Router cost story).
- Token Factory billing is per Nebius account — set limits in the Token Factory console.
- This repo's probe does **not** spend completion tokens; listing models is the only call.

## Honesty

- Adapter is **status / probe / role-map only**. No `chat.completions` in this PR.
- Connection stays **Unconnected / Planned** without a successful probe.
- Cloud execution and production readiness remain **unverified**.

## Working examples

Four upstream cookbook examples are mapped to Nirvana modules (all **not-run**) in
[TOKEN-FACTORY-EXAMPLES.md](TOKEN-FACTORY-EXAMPLES.md): Deep Research → Sentinel-Memory,
OpenCode → Muse-Claw DevOps, Agentic Cost Benchmark → Dragon Router, Confidence-gated
validation → JeV / --mev (pattern). `examples()` in `lib/nirvana/token-factory.mjs` exposes them.
