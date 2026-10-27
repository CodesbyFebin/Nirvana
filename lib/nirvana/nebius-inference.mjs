// Fail-closed Nebius GPU inference adapter (status / probe only).
// Grounded in https://github.com/nebius/nebius-solutions-library (k8s-inference/).
// Never POSTs models, never invokes, never spends. JeV remains NO EXECUTION AUTHORIZED.
// Nebius stays Unconnected / Planned until NEBIUS_INFERENCE_API_URL is set AND probe succeeds.

const ENTRY = {
  id: 'nebius-inference',
  name: 'Nebius GPU inference (k8s-inference / Serverless AI)',
};

function planned(detail = 'Unconnected / Planned') {
  return { ...ENTRY, status: 'Unconnected', connected: false, detail };
}

/** Read env knobs. Never expose the key outside this module. */
export function nebiusConfig(env = process.env) {
  const url = String(env.NEBIUS_INFERENCE_API_URL || '').trim().replace(/\/+$/, '');
  const key = String(env.NEBIUS_INFERENCE_API_KEY || '').trim();
  return { url: url || null, hasKey: Boolean(key) };
}

/** Sync view for registries that must not hit the network. */
export function status(env = process.env) {
  const { url } = nebiusConfig(env);
  if (!url) return planned('Unconnected / Planned');
  return planned('URL configured; Unconnected until probe succeeds (no spend, no model register)');
}

function modelsUrl(base) {
  return `${base}/v1/models`;
}

function sanitizeError(err) {
  const raw = err && (err.message || String(err));
  // Never echo Authorization / API keys if a transport layer stuffed them into the message.
  return String(raw || 'probe failed')
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/sk-[A-Za-z0-9_-]+/g, 'sk-[redacted]')
    .slice(0, 200);
}

/**
 * Probe only: GET /v1/models (or fall back to base URL) with a short timeout.
 * Returns Connected only when the upstream answers 2xx. Never invents models.
 * @param {{ env?: NodeJS.ProcessEnv, fetchImpl?: typeof fetch, timeoutMs?: number }} [opts]
 */
export async function probe({ env = process.env, fetchImpl = globalThis.fetch, timeoutMs = 5000 } = {}) {
  const cfg = nebiusConfig(env);
  if (!cfg.url) return planned('Unconnected / Planned');

  if (typeof fetchImpl !== 'function') {
    return planned('Probe unavailable (no fetch); Unconnected / Planned');
  }

  const key = String(env.NEBIUS_INFERENCE_API_KEY || '').trim();
  const headers = { Accept: 'application/json' };
  if (key) headers.Authorization = `Bearer ${key}`;

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller
    ? setTimeout(() => controller.abort(), Math.max(500, Math.min(timeoutMs, 15000)))
    : null;

  try {
    const res = await fetchImpl(modelsUrl(cfg.url), {
      method: 'GET',
      headers,
      signal: controller?.signal,
    });
    if (!res.ok) {
      return planned(`Probe HTTP ${res.status}; Unconnected / Planned`);
    }
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    // Observe only — do not invent catalog entries.
    const list = Array.isArray(body?.models)
      ? body.models
      : Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body)
          ? body
          : [];
    const observed = list
      .map((m) => ({
        id: typeof m?.id === 'string' ? m.id : typeof m?.name === 'string' ? m.name : null,
        kind: typeof m?.kind === 'string' ? m.kind : undefined,
      }))
      .filter((m) => m.id)
      .slice(0, 50);

    return {
      ...ENTRY,
      status: 'Connected',
      connected: true,
      detail: `GET /v1/models ok; ${observed.length} model(s) observed (status/probe only — no invoke)`,
      modelCount: observed.length,
      models: observed,
    };
  } catch (err) {
    return planned(`Probe failed: ${sanitizeError(err)}`);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Public registry row shape — never includes secrets. */
export function connectionRow(nebius = status()) {
  const connected = Boolean(nebius.connected) || nebius.status === 'Connected';
  return {
    id: nebius.id || ENTRY.id,
    name: nebius.name || ENTRY.name,
    status: connected ? 'Connected' : 'Unconnected',
    detail: nebius.detail || 'Unconnected / Planned',
  };
}
