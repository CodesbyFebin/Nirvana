# Nebius console surfaces → Nirvana planes

Recorded from the operator's Nebius console (EU project, captured 2026-10-28). Operator context only;
no project secrets are stored in this repo. Nirvana makes **no** create / provision calls and assumes
no Nebius API endpoints beyond the documented Token Factory base URL.

Console navigation seen: Compute (VMs, Kubernetes, GPU clusters), Storage, Networking, Serverless AI,
AI orchestration, PostgreSQL, MLflow, Applications, Cryptography, Observability, Billing.

| Surface | Use | Nirvana mapping | Row / status |
| --- | --- | --- | --- |
| Serverless AI **Job** | train / finetune / batch / eval | MaxText + kvax training, NPA eval, cost benchmark runs | `nebius-jobs` — Unconnected / Planned |
| Serverless AI **Endpoint** | serve / realtime / A-B / prod APIs | Triton/JAX or SGLang serve for Dragon Router | `nebius-endpoints` — Unconnected / Planned |
| **DevLab** | interactive dev env (NVIDIA AI Workbench, SGLang, Open WebUI, ComfyUI templates) | GPU experiments before a Job/Endpoint | not wired; operator-created only |
| **Token Factory** | managed OpenAI-compatible Nemotron | role map; SDLC Flow opt-in live stages | `nebius-token-factory` |
| **k8s-inference** (Solution Library) | self-operated GPU fleet via Terraform/Helm | JAX/Triton self-hosted path | `nebius-inference` |

## MCP server
The console's **"Copy MCP server"** project action is the operator path to plug Nebius into agent
tools, alongside [nebius/mcp-server](https://github.com/nebius/mcp-server) and
[contree-mcp](https://github.com/nebius/contree-mcp). The operator copies the config into their own
MCP client; Nirvana stores none of it, and any tool call stays JeV-gated.

## Prices
Preemptible spot prices (B200 / B300 / H100 / H200 / RTX PRO 6000) were **console-shown at capture
time** only. They are not live Nirvana telemetry and are not reproduced as current pricing.
