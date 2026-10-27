import { createHash, randomBytes, randomUUID } from 'node:crypto';

/** Stable JSON: sort object keys recursively; arrays keep order. */
export function canonicalize(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(value[k])}`).join(',')}}`;
}

export function sha256Hex(input) {
  const data = typeof input === 'string' ? input : canonicalize(input);
  return createHash('sha256').update(data).digest('hex');
}

export function newId() {
  return randomUUID();
}

export function newNonce() {
  return randomBytes(16).toString('hex');
}

export const GENESIS_HASH = '0'.repeat(64);

/** Domain-separated hash for audit events. */
export function auditEventDigest({ previous, type, data, time, seq }) {
  return sha256Hex({
    v: 1,
    kind: 'nirvana.audit_event',
    previous,
    type,
    data,
    time,
    seq,
  });
}

/** Canonical digest of an ActionManifestV1 object. */
export function actionManifestDigest(manifest) {
  return sha256Hex({ kind: 'nirvana.ActionManifestV1', ...manifest });
}
