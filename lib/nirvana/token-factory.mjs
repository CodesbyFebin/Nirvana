// Fail-closed Nebius Token Factory adapter (OpenAI-compatible managed inference).
// Grounded in https://github.com/nebius/token-factory-cookbook (models/nemotron/*).
// Probe/list only: GET {base}/models. NEVER calls chat.completions (no spend).
// Distinct from nebius-inference.mjs (self-operated k8s-inference GPU fleet for JAX/Triton).

export const DEFAULT_BASE_URL = 'https://api.tokenfactory.us-central1.nebius.com/v1/';

const ENTRY = {
  id: 'nebius-token-factory',
  name: 'Nebius Token Factory (Nemotron, OpenAI-compatible)',
};

/**
 * Logical role → model ID defaults from the cookbook (catalog may change).
 * Treat as LOGICAL defaults to discover; abort if a configured ID is missing after probe.
 * Casing matches cookbook README / model pages as of last check — not a live claim.
 */
export const ROLE_DEFAULTS = Object.freeze({
  planner: {
    role: 'planner',
    label: 'Brain / planner (Muse Wonder / JeV risk)',
    modelId: 'nvidia/Nemotron-3-Ultra-550b-a55b',
    cookbookRef: 'models/nemotron/nemotron3-ultra-550b-a55b.md',
  },
  coder: {
    role: 'coder',
    label: 'Hands / code gen (Muse-Claw DevOps)',
    modelId: 'nvidia/nemotron-3-super-120b-a12b',
    cookbookRef: 'models/nemotron/nemotron3-super-120B.md',
  },
  router: {
    role: 'router',
    label: 'Reflexes / Dragon Router classification',
    modelId: 'nvidia/Nemotron-3_5-Lightning',
    cookbookRef: 'models/nemotron/README.md (Lightning row)',
  },
});

function planned(detail = 'Unconnected / Planned') {
  return { ...ENTRY, status: 'Unconnected', connected: false, detail };
}

function normalizeBase(url) {
  const raw = String(url || '').trim();
  if (!raw) return DEFAULT_BASE_URL.replace(/\/+$/, '') + '/';
  return raw.replace(/\/+$/, '') + '/';
}

/** Read env. Never expose the key outside this module. */
export function tokenFactoryConfig(env = process.env) {
  const key = String(env.NEBIUS_API_KEY || '').trim();
  const baseUrl = normalizeBase(env.NEBIUS_TOKEN_FACTORY_BASE_URL || DEFAULT_BASE_URL);
  return { baseUrl, hasKey: Boolean(key) };
}

/** Sync view for registries that must not hit the network. */
export function status(env = process.env) {
  const { hasKey } = tokenFactoryConfig(env);
  if (!hasKey) return planned('Unconnected / Planned — set NEBIUS_API_KEY (no probe yet)');
  return planned('NEBIUS_API_KEY set; Unconnected until probe succeeds (list/models only — no chat spend)');
}

function sanitizeError(err) {
  const raw = err && (err.message || String(err));
  return String(raw || 'probe failed')
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/sk-[A-Za-z0-9_-]+/g, 'sk-[redacted]')
    .replace(/NEBIUS_API_KEY\s*=\s*\S+/gi, 'NEBIUS_API_KEY=[redacted]')
    .slice(0, 200);
}

function modelsUrl(base) {
  // OpenAI-compatible: GET {base}/models  (base already ends with /v1/)
  return `${normalizeBase(base)}models`;
}

/**
 * Probe only: GET {base}/models with Bearer NEBIUS_API_KEY.
 * Never invents catalog entries. Never calls chat.completions.
 * @param {{ env?: NodeJS.ProcessEnv, fetchImpl?: typeof fetch, timeoutMs?: number }} [opts]
 */
export async function probe({ env = process.env, fetchImpl = globalThis.fetch, timeoutMs = 8000 } = {}) {
  const cfg = tokenFactoryConfig(env);
  if (!cfg.hasKey) return planned('Unconnected / Planned — set NEBIUS_API_KEY');

  if (typeof fetchImpl !== 'function') {
    return planned('Probe unavailable (no fetch); Unconnected / Planned');
  }

  const key = String(env.NEBIUS_API_KEY || '').trim();
  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${key}`,
  };

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller
    ? setTimeout(() => controller.abort(), Math.max(500, Math.min(timeoutMs, 15000)))
    : null;

  const observedAt = new Date().toISOString();

  try {
    const res = await fetchImpl(modelsUrl(cfg.baseUrl), {
      method: 'GET',
      headers,
      signal: controller?.signal,
    });
    if (!res.ok) {
      return {
        ...planned(`Probe HTTP ${res.status}; Unconnected / Planned`),
        modelCount: 0,
        modelIdsSample: [],
        observedAt,
        error: `HTTP ${res.status}`,
      };
    }
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    const list = Array.isArray(body?.data)
      ? body.data
      : Array.isArray(body?.models)
        ? body.models
        : Array.isArray(body)
          ? body
          : [];
    const ids = list
      .map((m) => (typeof m?.id === 'string' ? m.id : typeof m?.name === 'string' ? m.name : null))
      .filter(Boolean);
    const sample = ids.slice(0, 20);

    return {
      ...ENTRY,
      status: 'Connected',
      connected: true,
      detail: `GET /models ok; ${ids.length} model(s) observed (list only — no chat.completions)`,
      modelCount: ids.length,
      modelIdsSample: sample,
      observedAt,
      baseUrl: cfg.baseUrl,
    };
  } catch (err) {
    return {
      ...planned(`Probe failed: ${sanitizeError(err)}`),
      modelCount: 0,
      modelIdsSample: [],
      observedAt,
      error: sanitizeError(err),
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Role → modelId table. Labeled defaults_unverified until a probe confirms IDs exist.
 * If probeResult is Connected and an ID is missing from the catalog, mark that role missing
 * (caller must abort — no silent fallback).
 */
export function roleModelMap(probeResult = null) {
  const roles = Object.values(ROLE_DEFAULTS).map((r) => ({ ...r }));
  const verified = Boolean(probeResult?.connected) && Array.isArray(probeResult?.modelIdsSample);
  // Full catalog may be larger than sample; prefer modelIdsSample + any models[] if present.
  const known = new Set();
  if (Array.isArray(probeResult?.modelIdsSample)) {
    for (const id of probeResult.modelIdsSample) known.add(id);
  }
  if (Array.isArray(probeResult?.models)) {
    for (const m of probeResult.models) {
      const id = typeof m === 'string' ? m : m?.id;
      if (id) known.add(id);
    }
  }

  const mapped = roles.map((r) => {
    if (!verified) {
      return { ...r, present: null, note: 'defaults_unverified' };
    }
    // Sample may be truncated — if modelCount > sample length, unknown IDs stay "unconfirmed"
    // rather than falsely "missing" when the ID simply wasn't in the first 20.
    const inSample = known.has(r.modelId);
    if (inSample) return { ...r, present: true, note: 'confirmed_in_catalog_sample' };
    const truncated = (probeResult.modelCount || 0) > known.size;
    if (truncated) return { ...r, present: null, note: 'unconfirmed_sample_truncated — re-probe or abort before spend' };
    return { ...r, present: false, note: 'missing_from_catalog — abort; no silent fallback' };
  });

  return {
    label: verified ? 'role_map_after_probe' : 'defaults_unverified',
    source: 'https://github.com/nebius/token-factory-cookbook',
    roles: mapped,
  };
}

/** Public registry row shape — never includes secrets. */
export function connectionRow(tf = status()) {
  const connected = Boolean(tf.connected) || tf.status === 'Connected';
  return {
    id: tf.id || ENTRY.id,
    name: tf.name || ENTRY.name,
    status: connected ? 'Connected' : 'Unconnected',
    detail: tf.detail || 'Unconnected / Planned',
  };
}
