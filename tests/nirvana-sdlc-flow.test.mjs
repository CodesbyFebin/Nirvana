import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  openNirvanaDb, verifyAuditChain, listPendingApprovals, decideApproval, listEvents,
} from '../lib/nirvana/store.mjs';
import {
  startFlow, getFlow, listFlows, STAGE_DEFS, DRY_RUN_GENERATORS, stageArtifactDigest,
} from '../lib/nirvana/sdlc-flow.mjs';
import {
  validateSdlcStageArtifactV1, validateEvidenceEnvelopeV1, loadSdlcContract, SDLC_STAGES,
} from '../lib/nirvana/contracts.mjs';

const input = { title: 'Fix login redirect loop', description: 'Users bounce between /login and /home after session expiry.', repo: 'acme/web' };
const mem = () => openNirvanaDb(':memory:');

test('runs 8 stages in order, all dry-run and valid', () => {
  const db = mem();
  const flow = startFlow(db, input, { env: { NEBIUS_API_KEY: 'x' } });
  assert.deepEqual(flow.stages.map((s) => s.stage), SDLC_STAGES);
  assert.deepEqual(SDLC_STAGES, ['planner', 'architect', 'coder', 'tester', 'security', 'compliance', 'deployer', 'greenops']);
  assert.equal(flow.mode, 'dry-run');
  for (const s of flow.stages) {
    assert.equal(s.status, 'completed');
    assert.equal(s.artifact.mode, 'dry-run');
    assert.equal(s.artifact.measured, false);
    assert.equal(validateSdlcStageArtifactV1(s.artifact).ok, true);
    assert.equal(s.artifactDigest, stageArtifactDigest(s.artifact));
  }
  assert.equal(loadSdlcContract().title, 'SdlcStageArtifactV1');
  assert.equal(listFlows(db).length, 1);
});

test('role map: planner/architect→planner, coder/tester→coder, rest→router', () => {
  const roles = Object.fromEntries(STAGE_DEFS.map((d) => [d.stage, d.role]));
  assert.deepEqual(roles, {
    planner: 'planner', architect: 'planner', coder: 'coder', tester: 'coder',
    security: 'router', compliance: 'router', deployer: 'router', greenops: 'router',
  });
});

test('context handoff: each stage input_digest = previous artifact digest; content derives', () => {
  const flow = startFlow(mem(), input);
  for (let i = 1; i < flow.stages.length; i++) {
    assert.equal(flow.stages[i].artifact.input_digest, flow.stages[i - 1].artifactDigest);
  }
  const [planner, architect, coder] = flow.stages.map((s) => s.artifact);
  assert.deepEqual(architect.body.file_map.map((f) => f.from_subtask), planner.body.subtasks.slice(1, 4).map((t) => t.id));
  assert.deepEqual(coder.body.patch_plan.map((p) => p.path), architect.body.file_map.map((f) => f.path));
});

test('invalid artifact halts the flow fail-closed', () => {
  const db = mem();
  const generators = { ...DRY_RUN_GENERATORS, coder: () => ({ summary: 'bad', body: { patch_plan: [], committed: true }, proposals: [] }) };
  const flow = startFlow(db, input, { generators });
  assert.equal(flow.status, 'halted');
  assert.deepEqual(flow.stages.map((s) => s.status),
    ['completed', 'completed', 'failed', 'skipped', 'skipped', 'skipped', 'skipped', 'skipped']);
  assert.equal(flow.evidenceEnvelope, null);
  assert.equal(listPendingApprovals(db).length, 0);
  assert.equal(verifyAuditChain(db).ok, true);
  // measured:true claims are rejected too
  const g2 = { ...DRY_RUN_GENERATORS, greenops: () => ({ summary: 's', body: { estimate: { label: 'measured', kg_co2e: 1, assumptions: ['x'] } }, proposals: [] }) };
  assert.equal(startFlow(mem(), input, { generators: g2 }).status, 'halted');
});

test('action stages yield pending JeV proposals, never executions; approval records consent only', () => {
  const db = mem();
  const flow = startFlow(db, input);
  const withActions = flow.stages.filter((s) => s.approvals.length).map((s) => s.stage);
  assert.deepEqual(withActions, ['coder', 'security', 'deployer']);
  const actions = flow.stages.flatMap((s) => s.approvals.map((a) => a.action));
  for (const a of ['apply-patch', 'commit', 'open-merge-request', 'deploy']) assert.ok(actions.includes(a));
  for (const s of flow.stages) for (const p of s.artifact.proposals) assert.equal(p.executed, false);
  const pending = listPendingApprovals(db);
  assert.equal(pending.length, actions.length);
  const deploy = pending.find((p) => p.manifest.method === 'deploy');
  assert.equal(deploy.manifest.artifact_digest, flow.stages[6].artifactDigest);
  assert.equal(deploy.manifest.destination, 'execution-blocked');
  const res = decideApproval(db, { approvalId: deploy.id, decision: 'approved', expectedActionDigest: deploy.actionDigest });
  assert.equal(res.execution.authorized, false);
  assert.match(res.execution.reason, /NO EXECUTION AUTHORIZED/);
  assert.equal(getFlow(db, flow.id).execution.authorized, false);
  assert.equal(flow.stages[2].artifact.body.committed, false);
  assert.equal(flow.stages[6].artifact.body.deployed, false);
});

test('audit chain verifies and includes every stage; envelope validates', () => {
  const db = mem();
  const flow = startFlow(db, input);
  assert.equal(verifyAuditChain(db).ok, true);
  const types = listEvents(db).map((e) => e.type);
  assert.equal(types.filter((t) => t === 'SDLC_STAGE_COMPLETED').length, 8);
  assert.ok(types.includes('SDLC_FLOW_COMPLETED'));
  assert.equal(validateEvidenceEnvelopeV1(flow.evidenceEnvelope).ok, true);
  assert.equal(flow.evidenceEnvelope.verification_status, 'pending');
  assert.equal(flow.evidenceEnvelope.verified_at, null);
  assert.equal(flow.evidenceEnvelope.artifact_digest, flow.stages[7].artifactDigest);
});

test('GreenOps is a labeled estimate; compliance is not certification', () => {
  const flow = startFlow(mem(), input);
  const g = flow.stages[7].artifact;
  assert.equal(g.body.estimate.label, 'estimate');
  assert.ok(g.body.estimate.assumptions.length >= 1);
  assert.match(g.summary, /ESTIMATE/);
  assert.equal(flow.stages[5].artifact.body.certification, false);
});

test('input validation rejects bad requests', () => {
  assert.throws(() => startFlow(mem(), { title: '', description: 'x' }), /title/);
  assert.throws(() => startFlow(mem(), { title: 'x', description: 'y', repo: 'not a repo' }), /repo/);
});

test('flow module makes no network/inference calls', () => {
  const src = readFileSync(new URL('../lib/nirvana/sdlc-flow.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /fetch\(|chat\.completions|probe\(/);
});
