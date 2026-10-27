// Fail-closed ConTree sandbox adapter (Nebius, Early Access).
// Grounded in https://github.com/nebius/contree-sdk, contree-cli, contree-mcp (Apache-2.0).
// STATUS/PROBE ONLY. Nirvana NEVER executes sandbox commands here (JeV: NO EXECUTION AUTHORIZED).
// Upstream READMEs document auth.ini `url` values (e.g. https://api.tokenfactory.nebius.com/sandboxes)
// but NOT a health/probe endpoint path, so we do not invent one: operator must set CONTREE_API_BASE
// to an exact read-only GET URL they have verified.

const ENTRY = { id: 'contree-sandbox', name: 'ConTree branching sandboxes (Nebius, Early Access)' };

function planned(detail = 'Early Access — Unconnected / Planned', extra = {}) {
  return { ...ENTRY, status: 'Unconnected', connected: false, detail, ...extra };
}

function readToken(env) {
  // Upstream uses CONTREE_TOKEN; CONTREE_API_TOKEN accepted as Nirvana alias. Value never leaves module.
  return String(env.CONTREE_API_TOKEN || env.CONTREE_TOKEN || '').trim();
}

export function contreeConfig(env = process.env) {
  const base = String(env.CONTREE_API_BASE || '').trim();
  return { hasToken: Boolean(readToken(env)), probeUrl: base || null };
}

export function status(env = process.env) {
  const { hasToken } = contreeConfig(env);
  if (!hasToken) return planned();
  return planned('Token present; Unconnected until probe succeeds (no sandbox execution)');
}

function sanitize(err, token) {
  let s = String((err && (err.message || err)) || 'probe failed');
  if (token) s = s.split(token).join('[redacted]');
  return s.replace(/Bearer\s+\S+/gi, 'Bearer [redacted]').slice(0, 200);
}

/** Read-only authenticated GET against operator-configured CONTREE_API_BASE. Never runs commands. */
export async function probe({ env = process.env, fetchImpl = globalThis.fetch, timeoutMs = 8000 } = {}) {
  const token = readToken(env);
  const cfg = contreeConfig(env);
  if (!token) return planned();
  if (!cfg.probeUrl) {
    return planned('Token present; probe endpoint not configured', { note: 'set CONTREE_API_BASE' });
  }
  let url;
  try {
    url = new URL(cfg.probeUrl);
    if (url.protocol !== 'https:') throw new Error('CONTREE_API_BASE must be https');
  } catch (err) {
    return planned(`Invalid CONTREE_API_BASE: ${sanitize(err, token)}`);
  }
  if (typeof fetchImpl !== 'function') return planned('Probe unavailable (no fetch)');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(500, Math.min(timeoutMs, 15000)));
  const observedAt = new Date().toISOString();
  try {
    const res = await fetchImpl(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    if (!res.ok) return planned(`Probe HTTP ${res.status}; Unconnected / Planned`, { observedAt });
    return {
      ...ENTRY, status: 'Connected', connected: true, observedAt,
      detail: 'Authenticated GET ok (probe only — Nirvana executes nothing in ConTree; JeV gate)',
    };
  } catch (err) {
    return planned(`Probe failed: ${sanitize(err, token)}`, { observedAt });
  } finally {
    clearTimeout(timer);
  }
}

export function capabilities() {
  return {
    label: 'concept',
    source: 'https://github.com/nebius/contree-cli',
    executionAuthorized: false,
    items: [
      { id: 'branch', label: 'concept', text: 'Git-like session branches over image snapshots' },
      { id: 'rollback', label: 'concept', text: 'Rewind to any previous checkpoint' },
      { id: 'vm-isolation', label: 'concept', text: 'Every command runs in a VM-isolated instance' },
      { id: 'immutable-images', label: 'concept', text: 'Each run produces an immutable image; snapshots form a tree' },
    ],
  };
}

export function connectionRow(c = status()) {
  const connected = Boolean(c.connected);
  return { id: ENTRY.id, name: ENTRY.name, status: connected ? 'Connected' : 'Unconnected', detail: c.detail || 'Early Access — Unconnected / Planned' };
}
