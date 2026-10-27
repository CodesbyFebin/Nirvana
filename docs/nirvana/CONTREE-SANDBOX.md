# ConTree — Nirvana execution / sandbox plane

> **Honesty banner:** ConTree is **Early Access** (API token via the request form at
> [contree.dev](https://contree.dev)). In Nirvana it is **Unconnected / Planned** until a token is
> configured *and* a probe succeeds. **Nirvana does not execute anything in ConTree yet** — the
> JeV gate stays at **NO EXECUTION AUTHORIZED**. Sandbox execution is a future, gated "qualify" path.

Upstream (Apache-2.0, Python): [contree-sdk](https://github.com/nebius/contree-sdk) ·
[contree-cli](https://github.com/nebius/contree-cli) · [contree-mcp](https://github.com/nebius/contree-mcp) ·
docs at [docs.contree.dev](https://docs.contree.dev/sdk/).

## Mapping

| Nirvana concept | ConTree backing |
|---|---|
| Execution / sandbox plane (MetaPen "500 sandboxes") | VM-isolated instance per command; full root; immutable images |
| Tree-search agent execution | Session branches + rollback over a snapshot tree |
| MCP tool gateway slot | `contree-mcp` (stdio or HTTP MCP server) |
| Kata-on-Nebius / k8s-inference | **Different thing** — your own GPU fleet; ConTree is a managed sandbox API |

### Why branch/rollback suits pentest & code agents
Upstream: every `run` snapshots the full filesystem into an **image**; images form a tree. An agent
can branch state, explore several solution (or attack-path) hypotheses in parallel, keep the best,
and roll back on failure without rebuilding. Crashes and side effects stay in the VM.

## Install (upstream)
```bash
pip install contree-sdk
pip install contree-cli     # or: uv tool install contree-cli
pip install contree-mcp     # or: uv tool install contree-mcp / uvx contree-mcp
```

## Auth
`contree auth` prompts for API token + project ID and saves to `~/.config/contree/auth.ini`
(`$XDG_CONFIG_HOME/contree/auth.ini`; override dir with `CONTREE_HOME`). `contree-mcp` reads the
same file. Upstream env vars during registration only: `CONTREE_TOKEN` (or `NEBIUS_API_KEY`),
`CONTREE_URL`, `CONTREE_PROJECT` (or `NEBIUS_AI_PROJECT`). Runtime commands use the saved profile.

Example IAM `auth.ini` shape from the contree-mcp README (placeholders only):
```ini
[DEFAULT]
profile = default
[profile:default]
type = iam
url = https://api.tokenfactory.nebius.com/sandboxes
token = <TOKEN HERE>
project = <NEBIUS PROJECT ID>
```

## Worked examples (copied from upstream READMEs)

### CLI branching (contree-cli)
```bash
eval $(contree use tag:ubuntu:latest)   # pick a base image for current session
contree run apt-get update -qq          # each run snapshots the result
contree run apt-get install -y curl     # builds on the previous snapshot
contree session branch experiment       # branch the sandbox state
contree session checkout experiment     # switch to the branch
contree run -- make test                # experiment freely
contree session checkout main           # switch back
contree session rollback -- -2          # or rewind two steps
```

### SDK async run (contree-sdk)
```python
import asyncio
from contree_sdk import Contree

async def main():
    # `api_client` is an already-built ContreeAsyncClient — see docs.contree.dev
    contree = Contree(api_client)
    image = await contree.images.use("ubuntu:latest")
    result = await image.run(shell='echo "Hello from Contree!"')
    print(result.stdout)

asyncio.run(main())
```

## Nirvana wiring (this repo)
- Fail-closed adapter: `lib/nirvana/contree.mjs` — `status()` / `probe()` only.
  Env: optional `CONTREE_API_TOKEN` or `CONTREE_TOKEN`. Never echoed.
  Probe: authenticated GET against operator-set `CONTREE_API_BASE` (upstream READMEs document
  auth `url` bases but **not** a health endpoint path — Nirvana does not invent one).
- Registry id: `contree-sandbox` (Connected only if probe truly succeeds).
- Deploy stubs: `deploy/contree/` (example session script + MCP client config — non-executing).
- **JeV:** `/api/nirvana/status` still reports `execution.authorized: false`.

## Qualify gates (all pending)
1. Early-Access token issued; `contree auth` succeeds.
2. Operator sets a verified read-only `CONTREE_API_BASE` and probe returns Connected.
3. Separate, explicit approval to allow Nirvana (or MetaPen) to call `run` / MCP tools — not this PR.
