import test from 'node:test';
import assert from 'node:assert/strict';
import { status, probe, capabilities, connectionRow } from '../lib/nirvana/physical-ai.mjs';
import { connectionRegistry } from '../lib/nirvana/store.mjs';

test('default status is disconnected, sim-only', () => {
  const s = status({});
  assert.equal(s.connected, false);
  assert.equal(s.hardwareConnected, false);
  assert.match(s.detail, /Sim-only \/ hardware-gated — Unconnected \/ Planned/);
});

test('probe never claims connection, even with local checkout', async () => {
  assert.equal((await probe({ env: {} })).connected, false);
  const r = await probe({ env: { NPA_ENABLED: '1', NEBIUS_PHYSICAL_AI_HOME: '/x' }, statImpl: async () => ({}) });
  assert.equal(r.connected, false);
  assert.equal(r.hardwareConnected, false);
  assert.equal(r.executionAuthorized, false);
  assert.equal(r.localCheckout, true);
  const m = await probe({ env: { NPA_ENABLED: '1', NEBIUS_PHYSICAL_AI_HOME: '/x' }, statImpl: async () => { throw new Error('no'); } });
  assert.equal(m.connected, false);
});

test('connection row is always Unconnected', () => {
  assert.equal(connectionRow({ connected: true, detail: 'x' }).status, 'Unconnected');
});

test('capabilities are concept-labeled', () => {
  const c = capabilities();
  assert.equal(c.label, 'concept');
  assert.equal(c.executionAuthorized, false);
  assert.ok(c.items.length >= 5);
  for (const i of c.items) assert.equal(i.label, 'concept');
});

test('registry includes nebius-physical-ai alongside existing rows', () => {
  const ids = connectionRegistry().map((r) => r.id);
  for (const id of ['nebius-physical-ai', 'contree-sandbox', 'nebius-token-factory', 'nebius-inference']) assert.ok(ids.includes(id), id);
  assert.equal(connectionRegistry().find((r) => r.id === 'nebius-physical-ai').status, 'Unconnected');
});
