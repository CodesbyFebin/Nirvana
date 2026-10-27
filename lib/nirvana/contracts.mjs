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

// ---- SdlcStageArtifactV1 (Muse-Claw SDLC Flow) ----
export const SDLC_STAGES = Object.freeze([
  'planner', 'architect', 'coder', 'tester', 'security', 'compliance', 'deployer', 'greenops',
]);
const SDLC_BODY_REQUIRED = Object.freeze({
  planner: ['subtasks', 'acceptance_criteria'],
  architect: ['adr', 'file_map', 'interfaces'],
  coder: ['patch_plan', 'committed'],
  tester: ['test_plan'],
  security: ['findings', 'proposed_fixes'],
  compliance: ['controls', 'certification'],
  deployer: ['ci_checks', 'rollout', 'rollback'],
  greenops: ['estimate'],
});
const SDLC_ACTIONS = new Set(['commit', 'open-merge-request', 'apply-patch', 'deploy']);

export function validateSdlcStageArtifactV1(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return fail('$', 'object required');
  const allowed = new Set([
    'schema_version', 'stage', 'position', 'mode', 'role', 'model_id', 'input_digest',
    'summary', 'body', 'proposals', 'measured',
  ]);
  let err = extraKeys(obj, allowed); if (err) return err;
  if (obj.schema_version !== 1) return fail('schema_version', 'must be 1');
  if (!SDLC_STAGES.includes(obj.stage)) return fail('stage', 'enum mismatch');
  if (obj.position !== SDLC_STAGES.indexOf(obj.stage) + 1) return fail('position', 'does not match stage order');
  if (!['dry-run', 'inference'].includes(obj.mode)) return fail('mode', 'enum mismatch');
  if (!['planner', 'coder', 'router'].includes(obj.role)) return fail('role', 'enum mismatch');
  err = checkString(obj, 'model_id'); if (err) return err;
  err = checkString(obj, 'input_digest', { min: 64, max: 64, pattern: HEX64 }); if (err) return err;
  err = checkString(obj, 'summary', { max: 2000 }); if (err) return err;
  if (obj.measured !== false) return fail('measured', 'must be false — no measured metrics are claimed');
  const body = obj.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return fail('body', 'object required');
  for (const k of SDLC_BODY_REQUIRED[obj.stage]) {
    if (!(k in body)) return fail(`body.${k}`, 'required');
  }
  if (obj.stage === 'coder' && body.committed !== false) return fail('body.committed', 'must be false');
  if (obj.stage === 'compliance' && body.certification !== false) return fail('body.certification', 'must be false');
  if (obj.stage === 'greenops') {
    const e = body.estimate;
    if (!e || e.label !== 'estimate') return fail('body.estimate.label', 'must be "estimate"');
    if (typeof e.kg_co2e !== 'number' || !(e.kg_co2e >= 0)) return fail('body.estimate.kg_co2e', 'number >= 0');
    if (!Array.isArray(e.assumptions) || e.assumptions.length < 1) return fail('body.estimate.assumptions', 'non-empty array');
  }
  if (!Array.isArray(obj.proposals)) return fail('proposals', 'array required');
  for (const [i, p] of obj.proposals.entries()) {
    if (!p || typeof p !== 'object') return fail(`proposals[${i}]`, 'object required');
    err = extraKeys(p, new Set(['action', 'description', 'executed'])); if (err) return err;
    if (!SDLC_ACTIONS.has(p.action)) return fail(`proposals[${i}].action`, 'enum mismatch');
    err = checkString(p, 'description', { max: 500, path: `proposals[${i}].description` }); if (err) return err;
    if (p.executed !== false) return fail(`proposals[${i}].executed`, 'must be false');
  }
  return { ok: true };
}

export function loadSdlcContract() {
  return loadSchema('SdlcStageArtifactV1.schema.json');
}
