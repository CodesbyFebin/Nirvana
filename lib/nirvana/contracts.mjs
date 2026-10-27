/**
 * Focused Draft-2020-12 validators for the three Nirvana contracts.
 * Validation ≠ cryptographic verification or authorization.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(DIR, '../..');

function loadSchema(name) {
  return JSON.parse(readFileSync(join(ROOT, 'contracts', name), 'utf8'));
}

const HEX64 = /^[a-f0-9]{64}$/;
const CURRENCY = /^[A-Z]{3}$/;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

function fail(path, msg) {
  return { ok: false, error: `${path}: ${msg}` };
}

function checkString(obj, key, { min = 1, max = 256, pattern, path } = {}) {
  const v = obj[key];
  if (typeof v !== 'string') return fail(path || key, 'string required');
  if (v.length < min || v.length > max) return fail(path || key, `length ${min}..${max}`);
  if (pattern && !pattern.test(v)) return fail(path || key, 'pattern mismatch');
  return null;
}

function checkInt(obj, key, { min = 0 } = {}) {
  const v = obj[key];
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min) return fail(key, `integer >= ${min}`);
  return null;
}

function extraKeys(obj, allowed) {
  const extras = Object.keys(obj).filter((k) => !allowed.has(k));
  if (extras.length) return fail('$', `additional properties: ${extras.join(',')}`);
  return null;
}

export function validateActionManifestV1(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return fail('$', 'object required');
  const allowed = new Set([
    'schema_version', 'workspace_id', 'task_id', 'task_revision', 'artifact_digest',
    'policy_digest', 'tool_id', 'method', 'destination', 'arguments_digest',
    'maximum_spend_minor_units', 'currency', 'expires_at', 'nonce',
  ]);
  let err = extraKeys(obj, allowed);
  if (err) return err;
  if (obj.schema_version !== 1) return fail('schema_version', 'must be 1');
  for (const k of ['workspace_id', 'task_id', 'tool_id', 'method', 'destination', 'nonce']) {
    err = checkString(obj, k); if (err) return err;
  }
  err = checkInt(obj, 'task_revision', { min: 1 }); if (err) return err;
  for (const k of ['artifact_digest', 'policy_digest', 'arguments_digest']) {
    err = checkString(obj, k, { min: 64, max: 64, pattern: HEX64 }); if (err) return err;
  }
  err = checkInt(obj, 'maximum_spend_minor_units', { min: 0 }); if (err) return err;
  err = checkString(obj, 'currency', { min: 3, max: 3, pattern: CURRENCY }); if (err) return err;
  err = checkString(obj, 'expires_at', { min: 10, max: 64, pattern: DATE_TIME }); if (err) return err;
  return { ok: true };
}

export function validateProofJournalV1(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return fail('$', 'object required');
  const allowed = new Set([
    'schema_version', 'input_digest', 'artifact_digest', 'policy_digest',
    'action_digest', 'checks_digest', 'passed',
  ]);
  let err = extraKeys(obj, allowed); if (err) return err;
  if (obj.schema_version !== 1) return fail('schema_version', 'must be 1');
  for (const k of ['input_digest', 'artifact_digest', 'policy_digest', 'action_digest', 'checks_digest']) {
    err = checkString(obj, k, { min: 64, max: 64, pattern: HEX64 }); if (err) return err;
  }
  if (typeof obj.passed !== 'boolean') return fail('passed', 'boolean required');
  return { ok: true };
}

export function validateEvidenceEnvelopeV1(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return fail('$', 'object required');
  const allowed = new Set([
    'schema_version', 'workspace_id', 'task_id', 'action_digest', 'artifact_digest',
    'guest_image_id', 'journal_digest', 'receipt_artifact_digest', 'verification_status',
    'verifier_version', 'verified_at', 'trusted_input_class',
  ]);
  let err = extraKeys(obj, allowed); if (err) return err;
  if (obj.schema_version !== 1) return fail('schema_version', 'must be 1');
  for (const k of ['workspace_id', 'task_id', 'verifier_version']) {
    err = checkString(obj, k); if (err) return err;
  }
  for (const k of ['action_digest', 'artifact_digest', 'guest_image_id', 'journal_digest', 'receipt_artifact_digest']) {
    err = checkString(obj, k, { min: 64, max: 64, pattern: HEX64 }); if (err) return err;
  }
  if (!['pending', 'verified', 'rejected'].includes(obj.verification_status)) {
    return fail('verification_status', 'enum mismatch');
  }
  if (obj.verified_at !== null) {
    err = checkString(obj, 'verified_at', { min: 10, max: 64, pattern: DATE_TIME }); if (err) return err;
  }
  if (!['guest-executed', 'signed-runner-assertions'].includes(obj.trusted_input_class)) {
    return fail('trusted_input_class', 'enum mismatch');
  }
  return { ok: true };
}

/** Schemas are loadable; useful for drift checks in tests. */
export function loadContracts() {
  return {
    ActionManifestV1: loadSchema('ActionManifestV1.schema.json'),
    ProofJournalV1: loadSchema('ProofJournalV1.schema.json'),
    EvidenceEnvelopeV1: loadSchema('EvidenceEnvelopeV1.schema.json'),
  };
}
