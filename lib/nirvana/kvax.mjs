// Fail-closed kvax adapter for Nirvana's JAX-on-NVIDIA serve path.
// Grounded in https://github.com/nebius/kvax (Apache-2.0): Flash Attention 2 for JAX in Triton,
// document masks, context parallelism, FSDP/HSDP sharding.
// kvax is a Python library imported INTO a JAX training/serve job. Nirvana never runs GPU kernels,
// never provisions GPUs, never submits MaxText/Triton jobs (JeV: NO EXECUTION AUTHORIZED).
// Upstream has no health endpoint; probe() only fs.stat()s an operator-pointed KVAX_HOME checkout.
import { stat } from 'node:fs/promises';
import path from 'node:path';

const ENTRY = { id: 'kvax', name: 'kvax FlashAttention for JAX (Nebius)' };
const DEFAULT_DETAIL = 'JAX FlashAttention kernel — Unconnected / Planned (no GPU job)';

function planned(detail = DEFAULT_DETAIL, extra = {}) {
  return { ...ENTRY, status: 'Unconnected', connected: false, gpuAcceleration: 'Planned / not configured', executionAuthorized: false, detail, ...extra };
}

export function kvaxConfig(env = process.env) {
  return { home: String(env.KVAX_HOME || '').trim() || null };
}

export function status() { return planned(); }

/** Read-only: does KVAX_HOME look like a kvax checkout? Never imports or executes it. */
export async function probe({ env = process.env, statImpl = stat } = {}) {
  const { home } = kvaxConfig(env);
  if (!home) return planned();
  const observedAt = new Date().toISOString();
  for (const p of [path.join(home, 'kvax'), path.join(home, 'pyproject.toml'), path.join(home, 'setup.py')]) {
    try {
      await statImpl(p);
      return planned('Local kvax checkout detected (not executed); no GPU job — Unconnected / Planned', { observedAt, localCheckout: true });
    } catch { /* keep looking */ }
  }
  return planned('KVAX_HOME set but no kvax checkout found — Unconnected / Planned', { observedAt, localCheckout: false });
}

export function capabilities() {
  return {
    label: 'concept',
    source: 'https://github.com/nebius/kvax',
    executionAuthorized: false,
    items: [
      { id: 'flashattention2', label: 'concept', text: 'Flash Attention 2 kernels for JAX, written in Triton' },
      { id: 'document_mask', label: 'concept', text: 'Block-wise document masks for densely packed long sequences; skips pad-only blocks' },
      { id: 'context_parallelism', label: 'concept', text: 'All-gather K/V context parallelism with token load balancing across GPUs' },
      { id: 'fsdp_hsdp', label: 'concept', text: 'Designed for distributed training on long sequences with FSDP/HSDP sharding' },
    ],
  };
}

export function connectionRow(c = status()) {
  return { id: ENTRY.id, name: ENTRY.name, status: 'Unconnected', detail: c.detail || DEFAULT_DETAIL };
}
