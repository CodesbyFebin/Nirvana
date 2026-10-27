import test from 'node:test';
import assert from 'node:assert/strict';
import { status, probe, capabilities, connectionRow } from '../lib/nirvana/kvax.mjs';
import { connectionRegistry } from '../lib/nirvana/store.mjs';

test('kvax default status is disconnected / Planned', () => {
  const s = status();
  assert.equal(s.id, 'kvax');
  assert.equal(s.connected, false);
  assert.equal(s.detail, 'JAX FlashAttention kernel — Unconnected / Planned (no GPU job)');
});

test('kvax probe never claims connection', async () => {
  assert.equal((await probe({ env: {} })).connected, false);
  const r = await probe({ env: { KVAX_HOME: '/x' }, statImpl: async () => ({}) });
  assert.equal(r.connected, false);
  assert.equal(r.executionAuthorized, false);
  assert.equal(r.localCheckout, true);
  const m = await probe({ env: { KVAX_HOME: '/x' }, statImpl: async () => { throw new Error('no'); } });
  assert.equal(m.connected, false);
  assert.equal(m.localCheckout, false);
  assert.equal(connectionRow({ connected: true, detail: 'x' }).status, 'Unconnected');
});

test('kvax capabilities are concept-labeled', () => {
  const c = capabilities();
  assert.equal(c.label, 'concept');
  assert.deepEqual(c.items.map((i) => i.id), ['flashattention2', 'document_mask', 'context_parallelism', 'fsdp_hsdp']);
  for (const i of c.items) assert.equal(i.label, 'concept');
});

test('registry includes kvax alongside existing rows', () => {
  const ids = connectionRegistry().map((r) => r.id);
  for (const id of ['kvax', 'nebius-physical-ai', 'contree-sandbox', 'nebius-token-factory', 'nebius-inference', 'local-store']) assert.ok(ids.includes(id), id);
  assert.equal(connectionRegistry().find((r) => r.id === 'kvax').status, 'Unconnected');
});
