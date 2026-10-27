// Edge-Sentinel air-gapped edge mode — ORIGINAL Nirvana adapter (defensive / architectural only).
// Status / probe / capabilities ONLY. This module never spawns processes, never runs network
// scanners, wireless tools, or exploit code, and never opens sockets. Discovery reports, device
// health, and sync are Planned concepts; findings arrive as operator-supplied data, not scans.

const ENTRY = { id: 'edge-sentinel-airgap', name: 'Edge-Sentinel air-gapped edge mode' };
const DEFAULT_DETAIL = 'Air-gap edge mode, local CVE catalog, health, sync bridge — Unconnected / Planned (no scans)';

function planned(detail = DEFAULT_DETAIL, extra = {}) {
  return {
    ...ENTRY, status: 'Unconnected', connected: false, executionAuthorized: false,
    scannerExecution: false, detail, ...extra,
  };
}

export function edgeSentinelConfig(env = process.env) {
  return { cveIndexPath: String(env.EDGE_SENTINEL_CVE_INDEX || '').trim() || null };
}

export function status() { return planned(); }

/** Empty seed for LocalCveIndexV1 (no live NVD scrape). */
export function emptyCveIndex() {
  return { schema_version: 1, kind: 'LocalCveIndexV1', source: 'operator-imported', generated_at: null, entries: [] };
}

/** Read-only: parse an operator-provided local CVE index file. Never fetches remotely. */
// Reader is injected by the caller (e.g. fs.promises.readFile) so the server bundle never traces fs.
export async function probe({ env = process.env, readImpl = null } = {}) {
  const { cveIndexPath } = edgeSentinelConfig(env);
  if (!cveIndexPath) return planned();
  if (typeof readImpl !== 'function') return planned('EDGE_SENTINEL_CVE_INDEX set; no reader supplied — Unconnected / Planned');
  const observedAt = new Date().toISOString();
  try {
    const idx = JSON.parse(await readImpl(cveIndexPath, 'utf8'));
    if (idx?.kind !== 'LocalCveIndexV1' || !Array.isArray(idx.entries)) throw new Error('not LocalCveIndexV1');
    return planned(`Local CVE catalog readable (${idx.entries.length} entries); no scans — Unconnected / Planned`, { observedAt, cveEntries: idx.entries.length });
  } catch {
    return planned('EDGE_SENTINEL_CVE_INDEX set but unreadable / invalid — Unconnected / Planned', { observedAt, cveEntries: null });
  }
}

export function capabilities() {
  return {
    label: 'concept',
    executionAuthorized: false,
    scannerExecution: false,
    items: [
      { id: 'airgap_mode', label: 'Planned', text: 'Operate offline with a local knowledge base; no cloud dependency at the edge' },
      { id: 'local_cve_catalog', label: 'Planned', text: 'Offline LocalCveIndexV1 cross-reference store (empty seed; operator imports data)' },
      { id: 'discovery_report_plane', label: 'Planned', text: 'Ingest host/service inventory reports for networks the operator owns; Nirvana runs no scanner' },
      { id: 'edge_health', label: 'Planned', text: 'EdgeHealthV1 CPU / network / boot-log telemetry schema for Pi-class devices' },
      { id: 'sync_bridge', label: 'Planned', text: 'Fail-closed sync of EvidenceEnvelopes from air-gap to cloud store when connectivity returns' },
      { id: 'security_report', label: 'concept', text: 'EvidenceEnvelope-compatible blue-team findings report template' },
    ],
  };
}

/** Sync bridge: fail-closed until a destination is configured AND JeV approves. Always refuses here. */
export function syncBridge() {
  return { synced: false, executionAuthorized: false, reason: 'Planned — sync bridge not configured; NO EXECUTION AUTHORIZED' };
}

/** Blue-team report template (EvidenceEnvelope-compatible payload body; findings supplied by operator). */
export function securityReportTemplate({ findings = [] } = {}) {
  return {
    kind: 'nirvana.EdgeSecurityReportV1',
    label: 'template',
    scope_note: 'Only assets the operator owns or is authorized to assess.',
    generated_by_scan: false,
    findings: findings.map((f) => ({
      asset: String(f.asset || ''), cve: f.cve || null, severity: f.severity || 'unknown',
      remediation: f.remediation || null, source: 'operator-supplied',
    })),
  };
}

export function connectionRow(c = status()) {
  return { id: ENTRY.id, name: ENTRY.name, status: 'Unconnected', detail: c.detail || DEFAULT_DETAIL };
}
