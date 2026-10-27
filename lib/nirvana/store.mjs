/**
 * Nirvana durable control-plane store (SQLite).
 * Single-writer audit via BEGIN IMMEDIATE. Approvals bind ActionManifest digests.
 * External execution is NEVER performed here — records only.
 */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  GENESIS_HASH, auditEventDigest, actionManifestDigest, newId, newNonce, sha256Hex,
} from './canonical.mjs';
import { classifyScope, assertModule } from './scope.mjs';
import { validateActionManifestV1 } from './contracts.mjs';
import { connectionRow, status as nebiusStatus } from './nebius-inference.mjs';
import {
  connectionRow as tokenFactoryRow,
  status as tokenFactoryStatus,
} from './token-factory.mjs';
import { connectionRow as contreeRow, status as contreeStatus } from './contree.mjs';
import { connectionRow as kvaxRow, status as kvaxStatus } from './kvax.mjs';
import { connectionRow as physicalAiRow, status as physicalAiStatus } from './physical-ai.mjs';

export const DEFAULT_WORKSPACE = '00000000-0000-4000-8000-0000000000aa';
export const POLICY_DIGEST_V1 = sha256Hex({ kind: 'nirvana.policy', version: 1, name: 'local-scope-v1' });

/** Crypto/storage preflight — fail BEFORE mutation (G0-01). */
export function assertWritable(db) {
  if (!db) throw Object.assign(new Error('Nirvana store unavailable'), { status: 503, code: 'STORE_UNAVAILABLE' });
  try {
    // Probe write capability without leaving durable residue.
    db.exec('BEGIN IMMEDIATE');
    db.exec('ROLLBACK');
  } catch (error) {
    throw Object.assign(new Error(`Storage not writable: ${error.message}`), {
      status: 503,
      code: 'STORAGE_DENIED',
    });
  }
}

export function openNirvanaDb(file = process.env.NIRVANA_DB_PATH || '.jules-state/nirvana.sqlite') {
  if (file !== ':memory:') {
    mkdirSync(dirname(resolve(/* turbopackIgnore: true */ file)), { recursive: true, mode: 0o700 });
  }
  const db = new DatabaseSync(file === ':memory:' ? file : resolve(/* turbopackIgnore: true */ file));
  if (file !== ':memory:' && process.platform !== 'win32') {
    try { chmodSync(resolve(/* turbopackIgnore: true */ file), 0o600); } catch { /* ignore chmod races */ }
  }
  db.exec(`PRAGMA journal_mode=WAL;
    PRAGMA busy_timeout=5000;
    PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS nirvana_tasks (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      module TEXT NOT NULL,
      scope TEXT NOT NULL CHECK(scope IN ('read','write','deploy')),
      status TEXT NOT NULL,
      revision INTEGER NOT NULL CHECK(revision >= 1),
      input_digest TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS nirvana_task_revisions (
      task_id TEXT NOT NULL,
      revision INTEGER NOT NULL,
      snapshot_json TEXT NOT NULL,
      snapshot_digest TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (task_id, revision),
      FOREIGN KEY (task_id) REFERENCES nirvana_tasks(id)
    );
    CREATE TABLE IF NOT EXISTS nirvana_audit_events (
      seq INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id TEXT NOT NULL,
      type TEXT NOT NULL,
      data_json TEXT NOT NULL,
      time TEXT NOT NULL,
      previous_hash TEXT NOT NULL,
      event_hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS nirvana_approvals (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      task_id TEXT NOT NULL,
      task_revision INTEGER NOT NULL,
      action_digest TEXT NOT NULL,
      manifest_json TEXT NOT NULL,
      decision TEXT NOT NULL CHECK(decision IN ('pending','approved','rejected')),
      actor TEXT NOT NULL,
      nonce TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      decided_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES nirvana_tasks(id)
    );
    CREATE TABLE IF NOT EXISTS nirvana_artifacts (
      digest TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      media_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      body_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS nirvana_flows (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      task_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      repo TEXT,
      mode TEXT NOT NULL,
      status TEXT NOT NULL,
      input_digest TEXT NOT NULL,
      envelope_json TEXT,
      halt_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES nirvana_tasks(id)
    );
    CREATE TABLE IF NOT EXISTS nirvana_flow_stages (
      flow_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      stage TEXT NOT NULL,
      status TEXT NOT NULL,
      artifact_digest TEXT,
      artifact_json TEXT,
      approval_ids_json TEXT NOT NULL DEFAULT '[]',
      error TEXT,
      created_at TEXT NOT NULL,
      PRIMARY KEY (flow_id, position),
      FOREIGN KEY (flow_id) REFERENCES nirvana_flows(id)
    );
  `);
  return db;
}

function lastAuditHash(db) {
  const row = db.prepare('SELECT event_hash FROM nirvana_audit_events ORDER BY seq DESC LIMIT 1').get();
  return row?.event_hash || GENESIS_HASH;
}

/**
 * Append one audit event under an already-open IMMEDIATE transaction.
 * Callers own BEGIN/COMMIT. Serializes all producers (tasks, decisions, torque).
 */
function appendEventTx(db, { workspaceId, type, data, time }) {
  const previous = lastAuditHash(db);
  // seq is assigned by AUTOINCREMENT; we need next seq for the digest.
  const nextSeq = (db.prepare('SELECT IFNULL(MAX(seq),0)+1 AS n FROM nirvana_audit_events').get()).n;
  const eventHash = auditEventDigest({ previous, type, data, time, seq: nextSeq });
  db.prepare(
    `INSERT INTO nirvana_audit_events (workspace_id, type, data_json, time, previous_hash, event_hash)
     VALUES (?,?,?,?,?,?)`,
  ).run(workspaceId, type, JSON.stringify(data), time, previous, eventHash);
  return { seq: nextSeq, previous, eventHash, type, time, data };
}

/** Exported for in-transaction producers (e.g. SDLC flow). Caller owns BEGIN/COMMIT. */
export const appendAuditEventTx = appendEventTx;

export function verifyAuditChain(db) {
  const rows = db.prepare('SELECT * FROM nirvana_audit_events ORDER BY seq ASC').all();
  let previous = GENESIS_HASH;
  for (const row of rows) {
    let data;
    try { data = JSON.parse(row.data_json); } catch { return { ok: false, at: row.seq, reason: 'corrupt data_json' }; }
    const expected = auditEventDigest({
      previous, type: row.type, data, time: row.time, seq: row.seq,
    });
    if (row.previous_hash !== previous || row.event_hash !== expected) {
      return { ok: false, at: row.seq, reason: 'hash mismatch' };
    }
    previous = row.event_hash;
  }
  return { ok: true, count: rows.length };
}

function taskRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    description: row.description,
    module: row.module,
    scope: row.scope,
    status: row.status,
    revision: row.revision,
    inputDigest: row.input_digest,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Atomic create: task + immutable revision 1 + TASK_CREATED audit event. */
export function createTask(db, input, { workspaceId = DEFAULT_WORKSPACE, actor = 'local-operator' } = {}) {
  assertWritable(db);
  const name = typeof input?.name === 'string' ? input.name.trim() : '';
  const description = typeof input?.description === 'string' ? input.description.trim() : '';
  if (!name || name.length > 120) throw Object.assign(new Error('Task name required (1..120)'), { status: 400 });
  if (!description || description.length > 3000) throw Object.assign(new Error('Description required (1..3000)'), { status: 400 });
  const module = assertModule(input.module);
  const scope = classifyScope(input.scope);
  const id = newId();
  const time = new Date().toISOString();
  const revision = 1;
  const snapshot = { id, name, description, module, scope: scope.id, status: scope.statusOnCreate, revision, actor };
  const inputDigest = sha256Hex({ kind: 'nirvana.task_input', ...snapshot });

  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare(
      `INSERT INTO nirvana_tasks
       (id,workspace_id,name,description,module,scope,status,revision,input_digest,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(id, workspaceId, name, description, module, scope.id, scope.statusOnCreate, revision, inputDigest, time, time);
    db.prepare(
      `INSERT INTO nirvana_task_revisions (task_id,revision,snapshot_json,snapshot_digest,created_at)
       VALUES (?,?,?,?,?)`,
    ).run(id, revision, JSON.stringify(snapshot), inputDigest, time);

    let approval = null;
    if (scope.requiresApproval) {
      // Artifact for this revision = the task input digest (placeholder until a real patch exists).
      const artifactDigest = inputDigest;
      const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString();
      const nonce = newNonce();
      const manifest = {
        schema_version: 1,
        workspace_id: workspaceId,
        task_id: id,
        task_revision: revision,
        artifact_digest: artifactDigest,
        policy_digest: POLICY_DIGEST_V1,
        tool_id: 'nirvana.scope-gate',
        method: 'approve-scope',
        destination: 'staging-blocked',
        arguments_digest: sha256Hex({ scope: scope.id, module }),
        maximum_spend_minor_units: 0,
        currency: 'USD',
        expires_at: expiresAt,
        nonce,
      };
      const v = validateActionManifestV1(manifest);
      if (!v.ok) throw Object.assign(new Error(`Manifest invalid: ${v.error}`), { status: 500 });
      const actionDigest = actionManifestDigest(manifest);
      const approvalId = newId();
      db.prepare(
        `INSERT INTO nirvana_approvals
         (id,workspace_id,task_id,task_revision,action_digest,manifest_json,decision,actor,nonce,expires_at,created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      ).run(approvalId, workspaceId, id, revision, actionDigest, JSON.stringify(manifest), 'pending', actor, nonce, expiresAt, time);
      // Content-addressed artifact record
      db.prepare(
        `INSERT OR IGNORE INTO nirvana_artifacts (digest,workspace_id,media_type,size_bytes,body_json,created_at)
         VALUES (?,?,?,?,?,?)`,
      ).run(artifactDigest, workspaceId, 'application/nirvana.task-input+json', JSON.stringify(snapshot).length, JSON.stringify(snapshot), time);
      approval = {
        id: approvalId,
        actionDigest,
        expiresAt,
        decision: 'pending',
        notice: 'Approval is a durable record only. External execution remains blocked.',
      };
    }

    const event = appendEventTx(db, {
      workspaceId,
      type: 'TASK_CREATED',
      data: { taskId: id, name, module, scope: scope.id, revision, inputDigest, requiresApproval: scope.requiresApproval, actor },
      time,
    });
    db.exec('COMMIT');
    return { task: taskRow(db.prepare('SELECT * FROM nirvana_tasks WHERE id=?').get(id)), approval, event };
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch { /* preserve */ }
    throw error;
  }
}

export function listTasks(db, { workspaceId = DEFAULT_WORKSPACE, status } = {}) {
  if (status) {
    return db.prepare('SELECT * FROM nirvana_tasks WHERE workspace_id=? AND status=? ORDER BY created_at DESC')
      .all(workspaceId, status).map(taskRow);
  }
  return db.prepare('SELECT * FROM nirvana_tasks WHERE workspace_id=? ORDER BY created_at DESC')
    .all(workspaceId).map(taskRow);
}

export function getTask(db, id, { workspaceId = DEFAULT_WORKSPACE } = {}) {
  return taskRow(db.prepare('SELECT * FROM nirvana_tasks WHERE id=? AND workspace_id=?').get(id, workspaceId));
}

export function getTaskRevision(db, taskId, revision) {
  const row = db.prepare('SELECT * FROM nirvana_task_revisions WHERE task_id=? AND revision=?').get(taskId, revision);
  if (!row) return null;
  return {
    taskId: row.task_id,
    revision: row.revision,
    snapshot: JSON.parse(row.snapshot_json),
    snapshotDigest: row.snapshot_digest,
    createdAt: row.created_at,
  };
}

/**
 * Decide an approval against the EXACT stored ActionManifest digest.
 * Rejects: wrong digest, expired, replayed nonce, non-pending, mutated artifact.
 * Does NOT execute anything external.
 */
export function decideApproval(db, {
  approvalId,
  decision, // 'approved' | 'rejected'
  expectedActionDigest,
  actor = 'local-operator',
  workspaceId = DEFAULT_WORKSPACE,
} = {}) {
  assertWritable(db);
  if (!['approved', 'rejected'].includes(decision)) {
    throw Object.assign(new Error('decision must be approved|rejected'), { status: 400 });
  }
  if (typeof expectedActionDigest !== 'string' || !/^[a-f0-9]{64}$/.test(expectedActionDigest)) {
    throw Object.assign(new Error('expectedActionDigest (sha256 hex) required'), { status: 400 });
  }

  const time = new Date().toISOString();
  db.exec('BEGIN IMMEDIATE');
  try {
    const row = db.prepare('SELECT * FROM nirvana_approvals WHERE id=? AND workspace_id=?').get(approvalId, workspaceId);
    if (!row) throw Object.assign(new Error('Approval not found'), { status: 404 });
    if (row.decision !== 'pending') throw Object.assign(new Error('Approval already decided'), { status: 409 });
    if (row.expires_at <= time) throw Object.assign(new Error('Approval expired'), { status: 410 });
    if (row.action_digest !== expectedActionDigest) {
      throw Object.assign(new Error('Action digest mismatch — approval binding rejected'), { status: 409, code: 'DIGEST_MISMATCH' });
    }
    // Recompute digest from stored manifest to catch tampering of manifest_json.
    let manifest;
    try { manifest = JSON.parse(row.manifest_json); } catch {
      throw Object.assign(new Error('Corrupt manifest'), { status: 500 });
    }
    const recomputed = actionManifestDigest(manifest);
    if (recomputed !== row.action_digest) {
      throw Object.assign(new Error('Stored manifest digest drift'), { status: 500 });
    }
    // Artifact must still match the manifest's artifact_digest (TOCTOU guard).
    const artifact = db.prepare('SELECT digest FROM nirvana_artifacts WHERE digest=?').get(manifest.artifact_digest);
    if (!artifact) {
      throw Object.assign(new Error('Artifact missing — approval binding rejected'), { status: 409, code: 'ARTIFACT_MISSING' });
    }

    const result = db.prepare(
      `UPDATE nirvana_approvals SET decision=?, decided_at=?, actor=?
       WHERE id=? AND decision='pending' AND action_digest=? AND expires_at>?`,
    ).run(decision, time, actor, approvalId, expectedActionDigest, time);
    if (result.changes !== 1) {
      throw Object.assign(new Error('Approval race — not updated'), { status: 409 });
    }

    const newStatus = decision === 'approved' ? 'Ready — runtime unconnected' : 'Rejected';
    db.prepare('UPDATE nirvana_tasks SET status=?, updated_at=? WHERE id=? AND revision=?')
      .run(newStatus, time, row.task_id, row.task_revision);

    const event = appendEventTx(db, {
      workspaceId,
      type: decision === 'approved' ? 'SCOPE_APPROVED' : 'SCOPE_REJECTED',
      data: {
        approvalId,
        taskId: row.task_id,
        taskRevision: row.task_revision,
        actionDigest: row.action_digest,
        scope: manifest /* keep small */ && JSON.parse(row.manifest_json).tool_id,
        actor,
        notice: 'External execution remains blocked. Approval is a record only.',
      },
      time,
    });
    db.exec('COMMIT');
    return {
      approval: {
        id: approvalId,
        decision,
        actionDigest: row.action_digest,
        taskId: row.task_id,
        decidedAt: time,
      },
      task: getTask(db, row.task_id, { workspaceId }),
      event,
      execution: { authorized: false, reason: 'NO EXECUTION AUTHORIZED — JeV gate keeps external actions blocked' },
    };
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch { /* preserve */ }
    throw error;
  }
}

export function listPendingApprovals(db, { workspaceId = DEFAULT_WORKSPACE } = {}) {
  const now = new Date().toISOString();
  return db.prepare(
    `SELECT a.*, t.name AS task_name, t.scope AS task_scope, t.module AS task_module
     FROM nirvana_approvals a JOIN nirvana_tasks t ON t.id = a.task_id
     WHERE a.workspace_id=? AND a.decision='pending' AND a.expires_at > ?
     ORDER BY a.created_at ASC`,
  ).all(workspaceId, now).map((r) => ({
    id: r.id,
    taskId: r.task_id,
    taskRevision: r.task_revision,
    taskName: r.task_name,
    taskScope: r.task_scope,
    taskModule: r.task_module,
    actionDigest: r.action_digest,
    expiresAt: r.expires_at,
    createdAt: r.created_at,
    manifest: JSON.parse(r.manifest_json),
  }));
}

/** Scalar torque check — arithmetic only. Appends audit under single-writer lock. */
export function recordTorqueCheck(db, { torque, limit, workspaceId = DEFAULT_WORKSPACE, actor = 'local-operator' } = {}) {
  assertWritable(db);
  const t = Number(torque);
  const lim = Number(limit);
  if (!Number.isFinite(t) || !Number.isFinite(lim) || t < 0 || lim <= 0) {
    throw Object.assign(new Error('torque >= 0 and limit > 0 required'), { status: 400 });
  }
  const pass = t <= lim;
  const time = new Date().toISOString();
  db.exec('BEGIN IMMEDIATE');
  try {
    const event = appendEventTx(db, {
      workspaceId,
      type: 'LOCAL_CONSTRAINT_CHECK',
      data: {
        torque: t,
        limit: lim,
        pass,
        actor,
        notice: 'Local arithmetic check only. Hardware execution remains disabled.',
      },
      time,
    });
    db.exec('COMMIT');
    return {
      pass,
      torque: t,
      limit: lim,
      label: pass ? 'WITHIN LIMIT' : 'BLOCKED',
      event,
      hardware: { connected: false, reason: 'Edge device / simulator unconnected' },
    };
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch { /* preserve */ }
    throw error;
  }
}

export function listEvents(db, { workspaceId = DEFAULT_WORKSPACE, limit = 200 } = {}) {
  const n = Math.min(Math.max(Number(limit) || 200, 1), 1000);
  return db.prepare(
    `SELECT seq, type, data_json, time, previous_hash, event_hash
     FROM nirvana_audit_events WHERE workspace_id=? ORDER BY seq DESC LIMIT ?`,
  ).all(workspaceId, n).map((r) => ({
    seq: r.seq,
    type: r.type,
    data: JSON.parse(r.data_json),
    time: r.time,
    previous: r.previous_hash,
    hash: r.event_hash,
  }));
}

export function exportEvidence(db, { workspaceId = DEFAULT_WORKSPACE } = {}) {
  const chain = verifyAuditChain(db);
  return {
    format: 'nirvana-server-audit-v1',
    exportedAt: new Date().toISOString(),
    workspaceId,
    notice: 'SHA-256 links are hashes, not signatures or ZK proofs. No RISC Zero receipt is included.',
    chainVerification: chain,
    tasks: listTasks(db, { workspaceId }),
    approvals: db.prepare('SELECT * FROM nirvana_approvals WHERE workspace_id=? ORDER BY created_at').all(workspaceId).map((r) => ({
      id: r.id,
      taskId: r.task_id,
      taskRevision: r.task_revision,
      actionDigest: r.action_digest,
      decision: r.decision,
      nonce: r.nonce,
      expiresAt: r.expires_at,
      decidedAt: r.decided_at,
      createdAt: r.created_at,
    })),
    events: listEvents(db, { workspaceId, limit: 1000 }).reverse(),
    connections: connectionRegistry(),
  };
}

/** Honest connection registry — never fabricate live status.
 *  Pass `{ nebius, tokenFactory }` from awaited probes for the live status route.
 *  Default uses sync status() so exportEvidence never hits the network.
 */
export function connectionRegistry(options = {}) {
  // Two distinct Nebius surfaces:
  //   nebius-token-factory — managed OpenAI-compatible Nemotron (cookbook)
  //   nebius-inference     — self-operated k8s-inference GPU fleet (JAX/Triton)
  const tokenFactory = tokenFactoryRow(options.tokenFactory || tokenFactoryStatus());
  const nebius = connectionRow(options.nebius || nebiusStatus());
  const contree = contreeRow(options.contree || contreeStatus());
  const physicalAi = physicalAiRow(options.physicalAi || physicalAiStatus());
  const kvax = kvaxRow(options.kvax || kvaxStatus());
  return [
    tokenFactory,
    nebius,
    contree,
    physicalAi,
    kvax,
    { id: 'nebius-kata', name: 'Nebius compute & Kata', status: 'Unconnected', detail: 'Isolated job runner, VPC, mTLS — Planned' },
    { id: 'risc-zero', name: 'RISC Zero prover', status: 'Unconnected', detail: 'Guest image ID, real receipt verification — Planned / no live proof claimed' },
    { id: 'postgres-tbac', name: 'Managed PostgreSQL / TBAC memory', status: 'Unconnected', detail: 'Encrypted task grants — Planned' },
    { id: 'celestia', name: 'Celestia DA', status: 'Unconnected', detail: 'Optional public commitment — Planned' },
    { id: 'edge-device', name: 'Edge device / simulator', status: 'Unconnected', detail: 'Hardware interlock / OTA — Planned; local torque scalar only' },
    { id: 'local-store', name: 'Local Nirvana SQLite store', status: 'Connected', detail: 'Durable tasks, approvals, audit hash chain (this process)' },
    { id: 'basic-auth', name: 'HTTP Basic operator auth', status: 'Connected', detail: 'Single-operator fail-closed gate via proxy.js' },
  ];
}
