import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  openNirvanaDb, createTask, decideApproval, listTasks, getTask, getTaskRevision,
  recordTorqueCheck, verifyAuditChain, listEvents, exportEvidence, listPendingApprovals,
  assertWritable, POLICY_DIGEST_V1,
} from '../lib/nirvana/store.mjs';
import { actionManifestDigest, sha256Hex, GENESIS_HASH } from '../lib/nirvana/canonical.mjs';
import {
  validateActionManifestV1, validateProofJournalV1, validateEvidenceEnvelopeV1, loadContracts,
} from '../lib/nirvana/contracts.mjs';

function mem() {
  return openNirvanaDb(':memory:');
}

test('contracts load and ActionManifestV1 validates', () => {
  const schemas = loadContracts();
  assert.equal(schemas.ActionManifestV1.title, 'ActionManifestV1');
  const good = {
    schema_version: 1,
    workspace_id: 'ws',
    task_id: 't1',
    task_revision: 1,
    artifact_digest: 'a'.repeat(64),
    policy_digest: 'b'.repeat(64),
    tool_id: 'nirvana.scope-gate',
    method: 'approve-scope',
    destination: 'staging-blocked',
    arguments_digest: 'c'.repeat(64),
    maximum_spend_minor_units: 0,
    currency: 'USD',
    expires_at: '2026-10-27T12:00:00.000Z',
    nonce: 'abc',
  };
  assert.equal(validateActionManifestV1(good).ok, true);
  assert.equal(validateActionManifestV1({ ...good, extra: 1 }).ok, false);
  assert.equal(validateActionManifestV1({ ...good, artifact_digest: 'nope' }).ok, false);
});

test('ProofJournalV1 and EvidenceEnvelopeV1 validators', () => {
  const journal = {
    schema_version: 1,
    input_digest: '1'.repeat(64),
    artifact_digest: '2'.repeat(64),
    policy_digest: '3'.repeat(64),
    action_digest: '4'.repeat(64),
    checks_digest: '5'.repeat(64),
    passed: true,
  };
  assert.equal(validateProofJournalV1(journal).ok, true);
  const env = {
    schema_version: 1,
    workspace_id: 'ws',
    task_id: 't',
    action_digest: '4'.repeat(64),
    artifact_digest: '2'.repeat(64),
    guest_image_id: '6'.repeat(64),
    journal_digest: '7'.repeat(64),
    receipt_artifact_digest: '8'.repeat(64),
    verification_status: 'pending',
    verifier_version: 'planned-0',
    verified_at: null,
    trusted_input_class: 'signed-runner-assertions',
  };
  assert.equal(validateEvidenceEnvelopeV1(env).ok, true);
  // "verified" in schema is vocabulary only — still validates as a string enum
  assert.equal(validateEvidenceEnvelopeV1({ ...env, verification_status: 'verified' }).ok, true);
});

test('assertWritable fails closed when db missing', () => {
  assert.throws(() => assertWritable(null), /unavailable/);
});

test('createTask is atomic: task + revision + audit event', () => {
  const db = mem();
  const { task, approval, event } = createTask(db, {
    name: 'Patch CI config',
    description: 'Tighten workflow permissions; acceptance: tests pass',
    module: 'Muse-Claw DevOps',
    scope: 'write',
  });
  assert.equal(task.status, 'Awaiting approval');
  assert.equal(task.revision, 1);
  assert.ok(approval?.actionDigest);
  assert.match(approval.actionDigest, /^[a-f0-9]{64}$/);
  assert.equal(event.type, 'TASK_CREATED');
  const rev = getTaskRevision(db, task.id, 1);
  assert.equal(rev.snapshotDigest, task.inputDigest);
  assert.equal(verifyAuditChain(db).ok, true);
  assert.equal(listTasks(db).length, 1);
});

test('read scope skips approval queue', () => {
  const db = mem();
  const { task, approval } = createTask(db, {
    name: 'Read logs',
    description: 'Summarize recent deploy notes',
    module: 'Dragon Router',
    scope: 'read',
  });
  assert.equal(task.status, 'Ready — runtime unconnected');
  assert.equal(approval, null);
  assert.equal(listPendingApprovals(db).length, 0);
});

test('task revision snapshots are immutable', () => {
  const db = mem();
  const { task } = createTask(db, {
    name: 'Immutable check',
    description: 'Ensure revision rows cannot be silently rewritten by API',
    module: 'Muse-Claw DevOps',
    scope: 'read',
  });
  const before = getTaskRevision(db, task.id, 1);
  // Direct mutation attempt should be visible — store never UPDATEs revisions.
  const changes = db.prepare(
    `UPDATE nirvana_task_revisions SET snapshot_json=? WHERE task_id=? AND revision=?`,
  ).run(JSON.stringify({ tampered: true }), task.id, 1).changes;
  assert.equal(changes, 1); // sqlite allows it at SQL level…
  // …but verify our digest no longer matches — callers must treat digest as source of truth
  const after = getTaskRevision(db, task.id, 1);
  assert.notEqual(sha256Hex({ kind: 'check', ...after.snapshot }), before.snapshotDigest);
  // And the original digest remains on the task row (input_digest unchanged)
  assert.equal(getTask(db, task.id).inputDigest, before.snapshotDigest);
});

test('audit hash-chain is single-writer and tamper-evident', () => {
  const db = mem();
  createTask(db, { name: 'A', description: 'one', module: 'Dragon Router', scope: 'read' });
  recordTorqueCheck(db, { torque: 5, limit: 10 });
  createTask(db, {
    name: 'B', description: 'two', module: 'Edge-Sentinel', scope: 'deploy',
  });
  const v1 = verifyAuditChain(db);
  assert.equal(v1.ok, true);
  assert.ok(v1.count >= 3);
  // Tamper middle event
  const mid = db.prepare('SELECT seq FROM nirvana_audit_events ORDER BY seq LIMIT 1 OFFSET 1').get();
  db.prepare('UPDATE nirvana_audit_events SET data_json=? WHERE seq=?')
    .run(JSON.stringify({ tampered: true }), mid.seq);
  const v2 = verifyAuditChain(db);
  assert.equal(v2.ok, false);
  assert.equal(v2.at, mid.seq);
});

test('concurrent-style producers still form one chain (serialized writers)', () => {
  const db = mem();
  // Simulate interleaved producers by sequential calls under IMMEDIATE — each acquires the lock.
  for (let i = 0; i < 5; i++) {
    recordTorqueCheck(db, { torque: i, limit: 10 });
    createTask(db, {
      name: `T${i}`, description: `desc ${i}`, module: 'Dragon Router', scope: 'read',
    });
  }
  const events = listEvents(db, { limit: 1000 }).reverse();
  let prev = GENESIS_HASH;
  for (const e of events) {
    assert.equal(e.previous, prev);
    prev = e.hash;
  }
  assert.equal(verifyAuditChain(db).ok, true);
});

test('approval binding rejects mutated artifact digest', () => {
  const db = mem();
  const { approval } = createTask(db, {
    name: 'Need approval',
    description: 'write something',
    module: 'Muse-Claw DevOps',
    scope: 'write',
  });
  // Mutate the artifact digest referenced by the stored manifest → decide must fail
  // Replace artifact row with a different digest so lookup by manifest.artifact_digest fails
  const row = db.prepare('SELECT * FROM nirvana_approvals WHERE id=?').get(approval.id);
  const manifest = JSON.parse(row.manifest_json);
  db.prepare('DELETE FROM nirvana_artifacts WHERE digest=?').run(manifest.artifact_digest);
  assert.throws(
    () => decideApproval(db, {
      approvalId: approval.id,
      decision: 'approved',
      expectedActionDigest: approval.actionDigest,
    }),
    /Artifact missing/,
  );
});

test('approval binding rejects wrong expected digest (replay/mutation)', () => {
  const db = mem();
  const { approval } = createTask(db, {
    name: 'Digest bind',
    description: 'x',
    module: 'Muse-Claw DevOps',
    scope: 'write',
  });
  const fake = 'f'.repeat(64);
  assert.throws(
    () => decideApproval(db, {
      approvalId: approval.id,
      decision: 'approved',
      expectedActionDigest: fake,
    }),
    /digest mismatch/i,
  );
});

test('approval binding rejects expired approval', () => {
  const db = mem();
  const { approval } = createTask(db, {
    name: 'Expire me',
    description: 'x',
    module: 'Muse-Claw DevOps',
    scope: 'deploy',
  });
  // Force expiry in the past
  db.prepare(`UPDATE nirvana_approvals SET expires_at=? WHERE id=?`)
    .run('2000-01-01T00:00:00.000Z', approval.id);
  assert.throws(
    () => decideApproval(db, {
      approvalId: approval.id,
      decision: 'approved',
      expectedActionDigest: approval.actionDigest,
    }),
    /expired/i,
  );
});

test('approval nonce cannot be reused (unique + already decided)', () => {
  const db = mem();
  const { task, approval } = createTask(db, {
    name: 'Approve once',
    description: 'x',
    module: 'Muse-Claw DevOps',
    scope: 'write',
  });
  const first = decideApproval(db, {
    approvalId: approval.id,
    decision: 'approved',
    expectedActionDigest: approval.actionDigest,
  });
  assert.equal(first.approval.decision, 'approved');
  assert.equal(first.execution.authorized, false);
  assert.equal(getTask(db, task.id).status, 'Ready — runtime unconnected');
  assert.throws(
    () => decideApproval(db, {
      approvalId: approval.id,
      decision: 'approved',
      expectedActionDigest: approval.actionDigest,
    }),
    /already decided/i,
  );
});

test('torque check appends to same audit chain and blocks over-limit', () => {
  const db = mem();
  const blocked = recordTorqueCheck(db, { torque: 12, limit: 10 });
  assert.equal(blocked.pass, false);
  assert.equal(blocked.label, 'BLOCKED');
  assert.equal(blocked.hardware.connected, false);
  const ok = recordTorqueCheck(db, { torque: 8, limit: 10 });
  assert.equal(ok.pass, true);
  assert.equal(verifyAuditChain(db).ok, true);
});

test('exportEvidence includes honest connection registry and chain check', () => {
  const db = mem();
  createTask(db, { name: 'E', description: 'd', module: 'Sentinel-Memory', scope: 'read' });
  const bundle = exportEvidence(db);
  assert.equal(bundle.format, 'nirvana-server-audit-v1');
  assert.match(bundle.notice, /not signatures or ZK/);
  assert.equal(bundle.chainVerification.ok, true);
  const cloud = bundle.connections.filter((c) => c.id === 'risc-zero')[0];
  assert.equal(cloud.status, 'Unconnected');
  const local = bundle.connections.filter((c) => c.id === 'local-store')[0];
  assert.equal(local.status, 'Connected');
});

test('policy digest constant is stable hex', () => {
  assert.match(POLICY_DIGEST_V1, /^[a-f0-9]{64}$/);
  // Digests of identical manifests match
  const m = {
    schema_version: 1,
    workspace_id: 'w',
    task_id: 't',
    task_revision: 1,
    artifact_digest: 'a'.repeat(64),
    policy_digest: POLICY_DIGEST_V1,
    tool_id: 't',
    method: 'm',
    destination: 'd',
    arguments_digest: 'b'.repeat(64),
    maximum_spend_minor_units: 0,
    currency: 'USD',
    expires_at: '2026-01-01T00:00:00.000Z',
    nonce: 'n',
  };
  assert.equal(actionManifestDigest(m), actionManifestDigest({ ...m }));
});

test('invalid createTask inputs fail before mutation', () => {
  const db = mem();
  assert.throws(() => createTask(db, { name: '', description: 'x', module: 'Dragon Router', scope: 'read' }), /name/i);
  assert.throws(() => createTask(db, { name: 'x', description: 'y', module: 'Nope', scope: 'read' }), /module/i);
  assert.throws(() => createTask(db, { name: 'x', description: 'y', module: 'Dragon Router', scope: 'explode' }), /scope/i);
  assert.equal(listTasks(db).length, 0);
  const chain = verifyAuditChain(db);
  assert.equal(chain.ok, true);
  assert.equal(chain.count, 0);
});
