import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openNirvanaDb, listPendingApprovals } from '../lib/nirvana/store.mjs';
import { startFlowWithInference, inferenceEnabled, flowMode } from '../lib/nirvana/sdlc-flow.mjs';

const input = { title: 'Fix login redirect loop', description: 'Users bounce after session expiry.' };
const mem = () => openNirvanaDb(':memory:');
const LIVE = { NEBIUS_API_KEY: 'k', NIRVANA_SDLC_INFERENCE: '1' };
const noFetch = async () => { throw new Error('network must not be used'); };

test('no key or no opt-in → dry-run, no fetch', async () => {
  for (const env of [{}, { NEBIUS_API_KEY: 'k' }, { NIRVANA_SDLC_INFERENCE: '1' }]) {
    assert.equal(inferenceEnabled(env), false);
    const flow = await startFlowWithInference(mem(), input, { env, fetchImpl: noFetch });
    assert.equal(flow.mode, 'dry-run');
    for (const s of flow.stages) assert.equal(s.artifact.mode, 'dry-run');
  }
  assert.equal(flowMode(LIVE), 'live');
});

test('mocked success → live, usage recorded, roles mapped, proposals stay proposals', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body), auth: init.headers.authorization });
    return { ok: true, json: async () => ({ choices: [{ message: { content: 'proposal text' } }], usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 } }) };
  };
  const db = mem();
  const flow = await startFlowWithInference(db, input, { env: LIVE, fetchImpl });
  assert.equal(calls.length, 8);
  assert.ok(calls[0].url.endsWith('/chat/completions'));
  assert.equal(calls[0].body.model, calls[1].body.model); // planner/architect = Ultra
  assert.equal(calls[2].body.model, calls[3].body.model); // coder/tester = Super
  assert.notEqual(calls[0].body.model, calls[2].body.model);
  assert.match(flow.status, /^completed/);
  for (const s of flow.stages) {
    assert.equal(s.artifact.mode, 'live');
    assert.equal(s.artifact.measured, false);
    assert.deepEqual(s.artifact.body.inference.usage, { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15, source: 'api-reported' });
  }
  assert.equal(flow.execution.authorized, false);
  assert.ok(listPendingApprovals(db).length > 0);
});

test('mocked success without usage → usage null', async () => {
  const fetchImpl = async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: 'x' } }] }) });
  const flow = await startFlowWithInference(mem(), input, { env: LIVE, fetchImpl });
  assert.equal(flow.stages[0].artifact.body.inference.usage, null);
});

test('mocked failure → dry-run-fallback, flow still completes', async () => {
  for (const fetchImpl of [async () => { throw new Error('boom'); }, async () => ({ ok: false, status: 500 })]) {
    const flow = await startFlowWithInference(mem(), input, { env: LIVE, fetchImpl });
    assert.match(flow.status, /^completed/);
    for (const s of flow.stages) {
      assert.equal(s.artifact.mode, 'dry-run-fallback');
      assert.equal(s.artifact.body.inference.usage, null);
    }
  }
});

test('timeout → dry-run-fallback', async () => {
  const fetchImpl = (_u, init) => new Promise((_r, rej) => init.signal.addEventListener('abort', () => rej(Object.assign(new Error('a'), { name: 'AbortError' }))));
  const flow = await startFlowWithInference(mem(), input, { env: LIVE, fetchImpl, timeoutMs: 5 });
  assert.equal(flow.stages[0].artifact.mode, 'dry-run-fallback');
  assert.equal(flow.stages[0].artifact.body.inference.error, 'timeout');
});
