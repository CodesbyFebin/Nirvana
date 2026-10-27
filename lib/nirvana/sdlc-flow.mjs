/**
 * Muse-Claw SDLC Flow — 8 specialist stages, issue → deploy-ready PROPOSAL.
 *
 * Honesty constraints (enforced by code + SdlcStageArtifactV1 validation):
 *  - Default: deterministic dry-run/template mode, no inference call (no spend).
 *  - Opt-in live mode: ONLY when NEBIUS_API_KEY is set AND NIRVANA_SDLC_INFERENCE=1,
 *    startFlowWithInference() makes at most one Token Factory chat.completions call per
 *    stage (~20s timeout). Any error → stage mode 'dry-run-fallback' with template output.
 *    Only API-returned token usage is recorded (else null); nothing else is "measured".
 *  - Action-type outputs (commit, merge request, patch, deploy) are PROPOSALS only.
 *    Each becomes a pending JeV approval bound to the stage artifact digest.
 *    Approving records consent; NOTHING is executed (NO EXECUTION AUTHORIZED).
 *  - Compliance output is a checklist, not certification. GreenOps is an estimate,
 *    never a measurement. `measured` is always false.
 *  - SHA-256 digests and the audit chain are hashes, not signatures or ZK proofs.
 */
import {
  sha256Hex, newId, newNonce, actionManifestDigest, GENESIS_HASH,
} from './canonical.mjs';
import {
  validateSdlcStageArtifactV1, validateActionManifestV1, validateEvidenceEnvelopeV1, SDLC_STAGES,
} from './contracts.mjs';
import {
  DEFAULT_WORKSPACE, POLICY_DIGEST_V1, assertWritable, createTask, appendAuditEventTx,
} from './store.mjs';
import { roleModelMap, tokenFactoryConfig } from './token-factory.mjs';

export const FLOW_MODULE = 'Muse-Claw DevOps';
export const FLOW_NOTICE = 'Dry-run template artifacts. No inference ran, nothing was committed, merged, patched, or deployed. NO EXECUTION AUTHORIZED.';

/** Stage → Token Factory logical role (planner=Ultra, coder=Super, router=Lightning). */
export const STAGE_DEFS = Object.freeze([
  { stage: 'planner', label: 'Planner', role: 'planner', produces: 'Sub-tasks, estimates, acceptance criteria' },
  { stage: 'architect', label: 'Architect', role: 'planner', produces: 'Decision record, file map, interface contracts' },
  { stage: 'coder', label: 'Coder', role: 'coder', produces: 'Proposed change plan (not committed)' },
  { stage: 'tester', label: 'Tester', role: 'coder', produces: 'Proposed unit / integration test plan' },
  { stage: 'security', label: 'Security', role: 'router', produces: 'OWASP / secrets / dependency checklist + proposed fixes' },
  { stage: 'compliance', label: 'Compliance', role: 'router', produces: 'GDPR / SOC 2 / HIPAA control checklist (not certification)' },
  { stage: 'deployer', label: 'Deployer', role: 'router', produces: 'CI validation notes, rollout + rollback plan' },
  { stage: 'greenops', label: 'GreenOps', role: 'router', produces: 'CI carbon ESTIMATE with stated assumptions' },
]);

if (STAGE_DEFS.map((d) => d.stage).join() !== SDLC_STAGES.join()) {
  throw new Error('SDLC stage definitions drifted from contract');
}

function modelFor(role) {
  const map = roleModelMap(null); // defaults_unverified — never probed here
  return map.roles.find((r) => r.role === role)?.modelId || 'unassigned';
}

function words(text, n) {
  return String(text).replace(/\s+/g, ' ').trim().split(' ').slice(0, n).join(' ');
}
function slug(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'change';
}

/** Deterministic template generators. Each reads the previous artifacts (context handoff). */
export const DRY_RUN_GENERATORS = Object.freeze({
  planner({ input }) {
    const subtasks = [
      { id: 'T1', title: `Clarify scope: ${words(input.title, 8)}`, estimate_hours: 1 },
      { id: 'T2', title: 'Design interfaces and data changes', estimate_hours: 2 },
      { id: 'T3', title: 'Implement change behind review', estimate_hours: 4 },
      { id: 'T4', title: 'Add tests and update docs', estimate_hours: 2 },
    ];
    return {
      summary: `Template plan for "${words(input.title, 12)}" (${subtasks.length} sub-tasks).`,
      body: {
        subtasks,
        total_estimate_hours: subtasks.reduce((a, s) => a + s.estimate_hours, 0),
        estimate_basis: 'template heuristic, not a measured velocity',
        acceptance_criteria: [
          'Behaviour described in the issue is reproducible by a test',
          'Existing test suite stays green',
          'No new secrets or broadened permissions',
        ],
      },
      proposals: [],
    };
  },
  architect({ input, previous }) {
    const base = slug(input.title);
    const file_map = previous.planner.body.subtasks.slice(1, 4).map((t, i) => ({
      path: ['lib', 'app/api', 'tests'][i] + `/${base}${i === 2 ? '.test.mjs' : '.mjs'}`,
      purpose: t.title,
      from_subtask: t.id,
    }));
    return {
      summary: `Decision record + ${file_map.length}-entry file map derived from ${previous.planner.body.subtasks.length} planned sub-tasks.`,
      body: {
        adr: {
          title: `ADR: ${words(input.title, 10)}`,
          status: 'proposed',
          context: words(input.description, 40),
          decision: 'Keep the change inside one module with an explicit interface; no new external services.',
          consequences: 'Smaller blast radius; reviewers see one contract to check.',
        },
        file_map,
        interfaces: [{ name: `${base}Handler`, signature: '(input: object) => Promise<Result>' }],
      },
      proposals: [],
    };
  },
  coder({ previous }) {
    const patch_plan = previous.architect.body.file_map.map((f) => ({
      path: f.path,
      change: `Proposed edit for: ${f.purpose}`,
    }));
    return {
      summary: `Change plan touching ${patch_plan.length} files. Not written, not committed.`,
      body: { patch_plan, committed: false, diff: null, diff_note: 'No diff generated in dry-run mode.' },
      proposals: [
        { action: 'apply-patch', description: `Apply proposed edits to ${patch_plan.length} files`, executed: false },
        { action: 'commit', description: 'Commit the proposed change on a feature branch', executed: false },
        { action: 'open-merge-request', description: 'Open a merge/pull request for review', executed: false },
      ],
    };
  },
  tester({ previous }) {
    const test_plan = previous.coder.body.patch_plan.map((p) => ({
      kind: p.path.startsWith('tests') ? 'integration' : 'unit',
      name: `covers ${p.path}`,
      covers: p.path,
    }));
    for (const c of previous.planner.body.acceptance_criteria) {
      test_plan.push({ kind: 'acceptance', name: c, covers: 'acceptance criterion' });
    }
    return {
      summary: `Proposed ${test_plan.length} tests. None were run.`,
      body: { test_plan, executed: false },
      proposals: [],
    };
  },
  security({ previous }) {
    const findings = [
      'A01 Broken Access Control', 'A02 Cryptographic Failures', 'A03 Injection',
      'A05 Security Misconfiguration', 'A06 Vulnerable and Outdated Components',
      'Secrets in diff', 'Dependency risk',
    ].map((category) => ({ category, status: 'to-review', note: 'Checklist item; no scanner ran in dry-run.' }));
    return {
      summary: `Security checklist (${findings.length} items) for ${previous.coder.body.patch_plan.length} proposed file changes.`,
      body: {
        findings,
        proposed_fixes: ['Validate all new inputs at the module boundary', 'Keep tokens out of logs and fixtures'],
        scanner_ran: false,
      },
      proposals: [
        { action: 'apply-patch', description: 'Apply proposed hardening fixes', executed: false },
      ],
    };
  },
  compliance({ previous }) {
    const controls = [
      { framework: 'GDPR', control: 'Art. 25 data protection by design', status: 'to-review' },
      { framework: 'GDPR', control: 'Art. 30 records of processing', status: 'to-review' },
      { framework: 'SOC 2', control: 'CC8.1 change management', status: 'to-review' },
      { framework: 'SOC 2', control: 'CC6.1 logical access', status: 'to-review' },
      { framework: 'HIPAA', control: '164.312(b) audit controls', status: 'not-applicable-unless-PHI' },
    ];
    return {
      summary: 'Control-mapping checklist only. This is NOT a certification or audit opinion.',
      body: {
        controls,
        certification: false,
        evidence_refs: { security_findings: previous.security.body.findings.length },
      },
      proposals: [],
    };
  },
  deployer({ previous }) {
    return {
      summary: 'Rollout and rollback plan. Nothing was deployed.',
      body: {
        ci_checks: ['lint', 'unit tests', 'build', `${previous.tester.body.test_plan.length} proposed tests`],
        rollout: ['Deploy to staging (blocked)', 'Canary 5%', 'Full rollout after review'],
        rollback: ['Revert merge commit', 'Redeploy previous artifact digest'],
        deployed: false,
      },
      proposals: [
        { action: 'deploy', description: 'Deploy to staging, then production after review', executed: false },
      ],
    };
  },
  greenops({ previous }) {
    const ciMinutes = previous.deployer.body.ci_checks.length * 3;
    const runnerKw = 0.1;
    const gridKgPerKwh = 0.4;
    const kg = Number(((ciMinutes / 60) * runnerKw * gridKgPerKwh).toFixed(4));
    return {
      summary: `ESTIMATE ≈ ${kg} kg CO2e per CI run (assumption-based, not measured).`,
      body: {
        estimate: {
          label: 'estimate',
          kg_co2e: kg,
          assumptions: [
            `${ciMinutes} CI minutes (3 min per check, ${previous.deployer.body.ci_checks.length} checks)`,
            `${runnerKw} kW average runner draw`,
            `${gridKgPerKwh} kg CO2e/kWh grid intensity (generic placeholder)`,
          ],
        },
        eco_score: kg < 0.01 ? 'A (estimate)' : 'B (estimate)',
      },
      proposals: [],
    };
  },
});

/** Live inference requires BOTH a key and the explicit opt-in flag. */
export function inferenceEnabled(env = process.env) {
  return Boolean(String(env.NEBIUS_API_KEY || '').trim()) && String(env.NIRVANA_SDLC_INFERENCE || '').trim() === '1';
}

export function flowMode(env = process.env) {
  return inferenceEnabled(env) ? 'live' : 'dry-run';
}

export const STAGE_TIMEOUT_MS = 20_000;

/** One chat.completions call. Throws on any failure (caller falls back). */
export async function callStageInference({ def, input, template, env = process.env, fetchImpl = fetch, timeoutMs = STAGE_TIMEOUT_MS }) {
  const { baseUrl } = tokenFactoryConfig(env);
  const key = String(env.NEBIUS_API_KEY || '').trim();
  if (!key) throw new Error('no key');
  const model = modelFor(def.role);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(`${baseUrl}chat/completions`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        messages: [
          { role: 'system', content: `You are the ${def.label} stage of an SDLC review pipeline. Produce: ${def.produces}. Output is a PROPOSAL only; you cannot commit, merge, or deploy.` },
          { role: 'user', content: `Issue: ${input.title}\n\n${input.description}\n\nTemplate draft: ${template.summary}` },
        ],
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) throw new Error('empty completion');
    const u = data?.usage;
    const usage = u && typeof u === 'object' ? {
      prompt_tokens: Number.isFinite(u.prompt_tokens) ? u.prompt_tokens : null,
      completion_tokens: Number.isFinite(u.completion_tokens) ? u.completion_tokens : null,
      total_tokens: Number.isFinite(u.total_tokens) ? u.total_tokens : null,
      source: 'api-reported',
    } : null;
    return { text: text.slice(0, 4000), usage, model };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Async entry point. Without key or opt-in → identical to startFlow (dry-run).
 * With both → each stage = template structure + live completion text; any error → dry-run-fallback.
 */
export async function startFlowWithInference(db, input, opts = {}) {
  const { env = process.env, fetchImpl = globalThis.fetch, timeoutMs = STAGE_TIMEOUT_MS, ...rest } = opts;
  if (!inferenceEnabled(env)) return startFlow(db, input, { ...rest, env });
  const flowInput = {
    title: typeof input?.title === 'string' ? input.title.trim() : '',
    description: typeof input?.description === 'string' ? input.description.trim() : '',
  };
  if (!flowInput.title || !flowInput.description) return startFlow(db, input, { ...rest, env }); // let validation throw
  const outputs = {};
  const previous = {};
  for (const def of STAGE_DEFS) {
    let out;
    try { out = DRY_RUN_GENERATORS[def.stage]({ input: flowInput, previous }); } catch { break; }
    try {
      const r = await callStageInference({ def, input: flowInput, template: out, env, fetchImpl, timeoutMs });
      out = {
        ...out,
        body: { ...out.body, inference: { text: r.text, usage: r.usage, model_id: r.model, note: 'Live completion text (proposal only). Usage is API-reported; nothing else measured.' } },
        override: { mode: 'live' },
      };
    } catch (e) {
      out = {
        ...out,
        body: { ...out.body, inference: { text: null, usage: null, error: String(e?.name === 'AbortError' ? 'timeout' : e?.message || e).slice(0, 200) } },
        override: { mode: 'dry-run-fallback' },
      };
    }
    outputs[def.stage] = out;
    previous[def.stage] = out;
  }
  const generators = Object.fromEntries(STAGE_DEFS.map((d) => [d.stage, () => outputs[d.stage]]));
  return startFlow(db, input, { ...rest, env, generators });
}

export function stageArtifactDigest(artifact) {
  return sha256Hex({ kind: 'nirvana.SdlcStageArtifactV1', ...artifact });
}

function insertProposalApprovalTx(db, { workspaceId, taskId, artifactDigest, stage, proposal, actor, time }) {
  const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString();
  const nonce = newNonce();
  const manifest = {
    schema_version: 1,
    workspace_id: workspaceId,
    task_id: taskId,
    task_revision: 1,
    artifact_digest: artifactDigest,
    policy_digest: POLICY_DIGEST_V1,
    tool_id: `nirvana.sdlc-flow.${stage}`,
    method: proposal.action,
    destination: 'execution-blocked',
    arguments_digest: sha256Hex({ stage, action: proposal.action, description: proposal.description }),
    maximum_spend_minor_units: 0,
    currency: 'USD',
    expires_at: expiresAt,
    nonce,
  };
  const v = validateActionManifestV1(manifest);
  if (!v.ok) throw Object.assign(new Error(`Manifest invalid: ${v.error}`), { status: 500 });
  const actionDigest = actionManifestDigest(manifest);
  const id = newId();
  db.prepare(
    `INSERT INTO nirvana_approvals
     (id,workspace_id,task_id,task_revision,action_digest,manifest_json,decision,actor,nonce,expires_at,created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(id, workspaceId, taskId, 1, actionDigest, JSON.stringify(manifest), 'pending', actor, nonce, expiresAt, time);
  return { id, action: proposal.action, actionDigest, expiresAt, decision: 'pending', executed: false };
}

/**
 * Start and run a flow synchronously (all stages deterministic, local).
 * Fail-closed: a stage whose artifact fails validation (or throws) halts the flow;
 * later stages are recorded as skipped and no envelope is produced.
 */
export function startFlow(db, input, {
  workspaceId = DEFAULT_WORKSPACE, actor = 'local-operator', generators = DRY_RUN_GENERATORS, env = process.env,
} = {}) {
  assertWritable(db);
  const title = typeof input?.title === 'string' ? input.title.trim() : '';
  const description = typeof input?.description === 'string' ? input.description.trim() : '';
  const repo = typeof input?.repo === 'string' && input.repo.trim() ? input.repo.trim() : null;
  if (!title || title.length > 120) throw Object.assign(new Error('title required (1..120)'), { status: 400 });
  if (!description || description.length > 3000) throw Object.assign(new Error('description required (1..3000)'), { status: 400 });
  if (repo && (repo.length > 200 || !/^[\w.-]+\/[\w.-]+$/.test(repo))) {
    throw Object.assign(new Error('repo must be owner/name'), { status: 400 });
  }
  const mode = flowMode(env);
  const { task } = createTask(db, {
    name: title, description, module: FLOW_MODULE, scope: 'read',
  }, { workspaceId, actor });

  const flowId = newId();
  const time = new Date().toISOString();
  const flowInput = { title, description, repo };
  const inputDigest = sha256Hex({ kind: 'nirvana.sdlc_flow_input', ...flowInput });

  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare(
      `INSERT INTO nirvana_flows (id,workspace_id,task_id,title,description,repo,mode,status,input_digest,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(flowId, workspaceId, task.id, title, description, repo, mode, 'running', inputDigest, time, time);
    appendAuditEventTx(db, {
      workspaceId, type: 'SDLC_FLOW_STARTED', time,
      data: { flowId, taskId: task.id, inputDigest, mode, actor, notice: FLOW_NOTICE },
    });

    const previous = {};
    let previousDigest = inputDigest;
    const stageDigests = [];
    const approvalDigests = [];
    let halted = null;

    STAGE_DEFS.forEach((def, idx) => {
      const position = idx + 1;
      const insertStage = (status, extra = {}) => db.prepare(
        `INSERT INTO nirvana_flow_stages (flow_id,position,stage,status,artifact_digest,artifact_json,approval_ids_json,error,created_at)
         VALUES (?,?,?,?,?,?,?,?,?)`,
      ).run(flowId, position, def.stage, status, extra.digest || null, extra.json || null,
        JSON.stringify(extra.approvals || []), extra.error || null, time);
      if (halted) { insertStage('skipped'); return; }

      let artifact;
      let error = null;
      try {
        const gen = generators[def.stage];
        if (typeof gen !== 'function') throw new Error('no generator');
        const out = gen({ input: flowInput, previous, previousDigest, stage: def.stage });
        artifact = {
          schema_version: 1,
          stage: def.stage,
          position,
          mode,
          role: def.role,
          model_id: modelFor(def.role),
          input_digest: previousDigest,
          summary: out?.summary,
          body: out?.body,
          proposals: out?.proposals ?? [],
          measured: false,
          ...(out?.override || {}),
        };
        const v = validateSdlcStageArtifactV1(artifact);
        if (!v.ok) error = `validation failed: ${v.error}`;
      } catch (e) {
        error = `generator error: ${e.message}`;
      }
      if (error) {
        halted = { stage: def.stage, position, error };
        insertStage('failed', { error });
        appendAuditEventTx(db, {
          workspaceId, type: 'SDLC_STAGE_FAILED', time,
          data: { flowId, stage: def.stage, position, error },
        });
        return;
      }

      const digest = stageArtifactDigest(artifact);
      const json = JSON.stringify(artifact);
      db.prepare(
        `INSERT OR IGNORE INTO nirvana_artifacts (digest,workspace_id,media_type,size_bytes,body_json,created_at)
         VALUES (?,?,?,?,?,?)`,
      ).run(digest, workspaceId, 'application/nirvana.sdlc-stage-artifact-v1+json', json.length, json, time);
      const approvals = artifact.proposals.map((proposal) => insertProposalApprovalTx(db, {
        workspaceId, taskId: task.id, artifactDigest: digest, stage: def.stage, proposal, actor, time,
      }));
      insertStage('completed', { digest, json, approvals: approvals.map((a) => a.id) });
      appendAuditEventTx(db, {
        workspaceId, type: 'SDLC_STAGE_COMPLETED', time,
        data: {
          flowId, stage: def.stage, position, mode, artifactDigest: digest, inputDigest: previousDigest,
          approvalIds: approvals.map((a) => a.id), executed: false,
        },
      });
      previous[def.stage] = artifact;
      previousDigest = digest;
      stageDigests.push(digest);
      for (const a of approvals) approvalDigests.push(a.actionDigest);
    });

    let envelope = null;
    let status;
    if (halted) {
      status = 'halted';
      appendAuditEventTx(db, {
        workspaceId, type: 'SDLC_FLOW_HALTED', time,
        data: { flowId, ...halted, notice: 'Fail-closed: later stages skipped.' },
      });
    } else {
      status = 'completed — awaiting JeV (no execution)';
      envelope = {
        schema_version: 1,
        workspace_id: workspaceId,
        task_id: task.id,
        action_digest: sha256Hex({ kind: 'nirvana.sdlc_flow_actions', approvals: approvalDigests }),
        artifact_digest: previousDigest,
        guest_image_id: GENESIS_HASH, // none — no zkVM guest ran
        journal_digest: sha256Hex({ kind: 'nirvana.sdlc_flow_journal', inputDigest, stages: stageDigests }),
        receipt_artifact_digest: GENESIS_HASH, // none — no receipt exists
        verification_status: 'pending',
        verifier_version: 'none — dry-run, no prover',
        verified_at: null,
        trusted_input_class: 'signed-runner-assertions',
      };
      const v = validateEvidenceEnvelopeV1(envelope);
      if (!v.ok) throw Object.assign(new Error(`Envelope invalid: ${v.error}`), { status: 500 });
      appendAuditEventTx(db, {
        workspaceId, type: 'SDLC_FLOW_COMPLETED', time,
        data: { flowId, journalDigest: envelope.journal_digest, actionDigest: envelope.action_digest, executed: false },
      });
    }
    db.prepare('UPDATE nirvana_flows SET status=?, envelope_json=?, halt_reason=?, updated_at=? WHERE id=?')
      .run(status, envelope ? JSON.stringify(envelope) : null, halted ? `${halted.stage}: ${halted.error}` : null, time, flowId);
    db.exec('COMMIT');
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch { /* preserve */ }
    throw error;
  }
  return getFlow(db, flowId, { workspaceId });
}

function flowRow(r) {
  return {
    id: r.id, taskId: r.task_id, title: r.title, description: r.description, repo: r.repo,
    mode: r.mode, status: r.status, inputDigest: r.input_digest, haltReason: r.halt_reason,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

export function listFlows(db, { workspaceId = DEFAULT_WORKSPACE } = {}) {
  return db.prepare('SELECT * FROM nirvana_flows WHERE workspace_id=? ORDER BY created_at DESC LIMIT 200')
    .all(workspaceId).map(flowRow);
}

export function getFlow(db, id, { workspaceId = DEFAULT_WORKSPACE } = {}) {
  const r = db.prepare('SELECT * FROM nirvana_flows WHERE id=? AND workspace_id=?').get(id, workspaceId);
  if (!r) return null;
  const labels = Object.fromEntries(STAGE_DEFS.map((d) => [d.stage, d]));
  const stages = db.prepare('SELECT * FROM nirvana_flow_stages WHERE flow_id=? ORDER BY position').all(id).map((s) => {
    const approvalIds = JSON.parse(s.approval_ids_json);
    const approvals = approvalIds.map((aid) => {
      const a = db.prepare('SELECT id, action_digest, manifest_json, decision, expires_at, decided_at FROM nirvana_approvals WHERE id=?').get(aid);
      return a && {
        id: a.id, action: JSON.parse(a.manifest_json).method, actionDigest: a.action_digest,
        decision: a.decision, expiresAt: a.expires_at, decidedAt: a.decided_at, executed: false,
      };
    }).filter(Boolean);
    return {
      position: s.position, stage: s.stage, label: labels[s.stage]?.label, role: labels[s.stage]?.role,
      produces: labels[s.stage]?.produces, status: s.status, artifactDigest: s.artifact_digest,
      artifact: s.artifact_json ? JSON.parse(s.artifact_json) : null, approvals, error: s.error,
    };
  });
  return {
    ...flowRow(r),
    stages,
    evidenceEnvelope: r.envelope_json ? JSON.parse(r.envelope_json) : null,
    execution: { authorized: false, reason: 'NO EXECUTION AUTHORIZED — JeV gate keeps external actions blocked' },
    notice: FLOW_NOTICE,
  };
}
