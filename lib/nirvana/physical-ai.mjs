// Fail-closed Nebius Physical AI (NPA / "Workbench") adapter for Nirvana's Edge-Sentinel Bridge.
// Grounded in https://github.com/nebius/nebius-physical-ai (Apache-2.0, Python 3.11+, CLI `npa`).
// STATUS/PROBE ONLY. Nirvana NEVER runs `npa`, never submits SkyPilot jobs, never provisions GPUs
// or object storage, never launches robot policies (JeV: NO EXECUTION AUTHORIZED).
// Upstream documents no HTTP health endpoint for Nirvana to call, so probe() only checks
// (read-only, via fs.stat) whether an operator-pointed local checkout/venv contains an `npa` entrypoint.
// Even then the connection stays Unconnected: sim-only / hardware-gated.
import { stat } from 'node:fs/promises';
import path from 'node:path';

const ENTRY = { id: 'nebius-physical-ai', name: 'Nebius Physical AI Workbench (NPA) — Edge-Sentinel' };
const DEFAULT_DETAIL = 'Sim-only / hardware-gated — Unconnected / Planned';

function planned(detail = DEFAULT_DETAIL, extra = {}) {
  return { ...ENTRY, status: 'Unconnected', connected: false, hardwareConnected: false, executionAuthorized: false, detail, ...extra };
}

export function physicalAiConfig(env = process.env) {
  const enabled = /^(1|true|yes)$/i.test(String(env.NPA_ENABLED || '').trim());
  const home = String(env.NEBIUS_PHYSICAL_AI_HOME || '').trim() || null;
  return { enabled, home };
}

export function status(env = process.env) {
  const { enabled } = physicalAiConfig(env);
  if (!enabled) return planned();
  return planned('NPA_ENABLED set; still sim-only / hardware-gated — Unconnected / Planned (no jobs launched)');
}

/** Read-only local check: does NEBIUS_PHYSICAL_AI_HOME contain an npa entrypoint? Never executes it. */
export async function probe({ env = process.env, statImpl = stat } = {}) {
  const { enabled, home } = physicalAiConfig(env);
  if (!enabled || !home) return planned();
  const candidates = [path.join(home, '.venv', 'bin', 'npa'), path.join(home, 'npa', 'pyproject.toml')];
  const observedAt = new Date().toISOString();
  for (const p of candidates) {
    try {
      await statImpl(p);
      return planned('Local NPA checkout detected (not executed); sim-only / hardware-gated — Unconnected / Planned', { observedAt, localCheckout: true });
    } catch { /* keep looking */ }
  }
  return planned('NEBIUS_PHYSICAL_AI_HOME set but no npa checkout found — Unconnected / Planned', { observedAt, localCheckout: false });
}

export function capabilities() {
  return {
    label: 'concept',
    source: 'https://github.com/nebius/nebius-physical-ai',
    executionAuthorized: false,
    hardwareConnected: false,
    items: [
      { id: 'simulation', label: 'concept', text: 'Simulation workloads (sim-only in Nirvana)' },
      { id: 'policy-training', label: 'concept', text: 'Robot policy training (e.g. GR00T fine-tune workflows upstream)' },
      { id: 'synthetic-data', label: 'concept', text: 'Synthetic data / Cosmos augmentation workflows' },
      { id: 'evaluation', label: 'concept', text: 'Offline policy evaluation and artifact inspection' },
      { id: 'skypilot-workflows', label: 'concept', text: 'Workflow YAML submitted via SkyPilot to Nebius Kubernetes (operator-side, not Nirvana)' },
    ],
  };
}

export function connectionRow(c = status()) {
  return { id: ENTRY.id, name: ENTRY.name, status: 'Unconnected', detail: c.detail || DEFAULT_DETAIL };
}
