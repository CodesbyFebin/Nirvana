# Token Factory working examples → Nirvana modules

> **Status: not-run from Nirvana.** Every example below is documented and mapped only. Nirvana has
> made **no** Token Factory inference calls, **no** Tavily calls, **no** Tendem tasks, and spent
> nothing. Any figures quoted here are **upstream example figures** (with source links), never
> Nirvana-measured. JeV / --mev remains **NO EXECUTION AUTHORIZED**.

Source of truth: [nebius/token-factory-cookbook](https://github.com/nebius/token-factory-cookbook)
(checked 2026-10-28). The Nebius console "Start from working examples" cards map onto these paths.
`nebius/serverless-ai-cookbook` contained no matching paths for these four.

| # | Example | Upstream path | Nirvana module | Status |
|---|---|---|---|---|
| 1 | Deep Research Agent (Tavily + Token Factory) | [agents/langchain/deep-agent-example-1](https://github.com/nebius/token-factory-cookbook/tree/main/agents/langchain/deep-agent-example-1) (`tavily_agent.py`); index: [integrations/tavily](https://github.com/nebius/token-factory-cookbook/tree/main/integrations/tavily) | Sentinel-Memory Vault (Personal AI) | not-run |
| 2 | OpenCode with Token Factory | [coding/opencode.md](https://github.com/nebius/token-factory-cookbook/blob/main/coding/opencode.md) | Muse-Claw DevOps (Coding) | not-run |
| 3 | Agentic Cost Benchmark | [agents/agent-cost-comparison-1](https://github.com/nebius/token-factory-cookbook/tree/main/agents/agent-cost-comparison-1) | Dragon Router (model pick / inference spend) | not-run |
| 4 | Invoice Extraction, Confidence-Gated Human Validation | [integrations/tendem-invoice-validation](https://github.com/nebius/token-factory-cookbook/tree/main/integrations/tendem-invoice-validation) | JeV / --mev approval desk (pattern only) | not-run |

## 1. Deep Research Agent → Sentinel-Memory

LangChain `deepagents` (planning via `write_todos`, virtual FS, sub-agents) on a Token Factory
model via `langchain-nebius` (upstream configured with `MiniMaxAI/MiniMax-M3`). Upstream steps:

```bash
cd agents/langchain/deep-agent-example-1
uv sync
cp env.example .env   # NEBIUS_API_KEY=..., TAVILY_API_KEY=... (Tavily only for tavily_agent.py)
uv run python research_agent_1.py   # bare deep agent → output.md
uv run python tavily_agent.py       # with Tavily web search; prints JSON trace
```

Nirvana mapping: sourced, multi-step report as a Sentinel-Memory artifact. Vault storage/TBAC is
not implemented; no retrieval or web search runs from Nirvana.

## 2. OpenCode → Muse-Claw DevOps

OpenCode has Nebius Token Factory as a built-in provider: `opencode` → `/connect` → pick
**Nebius Token Factory** → paste key → `/models`. Alternatives: custom provider in
`~/.config/opencode/opencode.jsonc` (`@ai-sdk/openai-compatible`, baseURL
`https://api.tokenfactory.nebius.com/v1`) or the Nebius TF Relay proxy. Non-interactive form:

```bash
opencode run --model nebius/zai-org/GLM-5.2 --auto "$(cat prompt.md)"
```

Upstream example figures (one run on GLM-5.2, 2026-08-28, opencode 1.18.21, per
[coding/opencode.md](https://github.com/nebius/token-factory-cookbook/blob/main/coding/opencode.md#what-one-run-costs)):
21 turns, 483,125 input tokens, 9,830 output (+9,576 reasoning), 128 s, $0.7618. **Not Nirvana-measured.**

Nirvana mapping: candidate terminal coding runtime for Muse-Claw. Coding runtime stays **not connected**.

## 3. Agentic Cost Benchmark → Dragon Router

Runs the same deepagents data-analysis task (no shell / code-exec tool) across models and compares
cost, latency, tokens, correctness against `expected.json`. Upstream models:
`nvidia/Nemotron-3-Ultra-550b-a55b`, `nvidia/nemotron-3-super-120b-a12b`, `nvidia/Nemotron-3_5-Lightning`
— the same IDs as Nirvana's planner / coder / router role defaults.

```bash
uv sync
echo 'NEBIUS_API_KEY=<your-key>' > .env
uv run agent_cost_comparison_1.py                 # data-1 suite
uv run agent_cost_comparison_1.py --data-dir data-2
```

Nirvana mapping: the source for the Dragon Router inference-spend / model-pick card. The card stays
**"—"** until a real, approved run produces numbers. Nirvana ships no benchmark results.

## 4. Confidence-Gated Human Validation → JeV / --mev (pattern)

Extract (Nebius vision model, upstream `Qwen/Qwen2.5-VL-72B-Instruct`) → Route (plain deterministic
Python: escalate if confidence < `0.95` or a required field is missing) → Validate (paid human task
via Tendem by Toloka, capped by `MAX_HUMAN_PRICE_USD`; quotes above the cap raise instead of approving).

```bash
git clone https://github.com/amrrs/toloka-nebiustf-validation.git
cd toloka-nebiustf-validation && uv sync --extra dev
export NEBIUS_API_KEY=...; export TENDEM_API_KEY=...
uv run python use_cases/invoice_vision_human_validation.py
```

Upstream example figures (from the cookbook README): extraction ~$0.000147 / 342+82 tokens / 3.8 s;
human validation $3.00 on the sample run. **Not Nirvana-measured.**

Nirvana mapping: mirrors JeV's design — deterministic, auditable routing; humans approve only
uncertain items; a price/scope cap fails closed. This is a **pattern doc**, not a Tendem integration.

## Honesty

- `lib/nirvana/token-factory.mjs` `examples()` returns these four entries, all `status: 'not-run'`,
  with no metrics fields and no network access. Exposed as `tokenFactoryExamples` on `/api/nirvana/status`.
- Running any example requires a real key and explicitly approved spend.
