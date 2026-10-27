import { test } from 'node:test';
import assert from 'node:assert/strict';
import { status, probe, capabilities, connectionRow } from '../lib/nirvana/contree.mjs';
import { connectionRegistry } from '../lib/nirvana/store.mjs';

const TOKEN = 'ctr-secret-token-XYZ123';

test('no token => disconnected, Early Access Planned', async () => {
  const s = status({});
  assert.equal(s.connected, false);
  assert.equal(s.id, 'contree-sandbox');
  assert.match(s.detail, /Early Access — Unconnected \/ Planned/);
  const p = await probe({ env: {}, fetchImpl: () => { throw new Error('must not fetch'); } });
  assert.equal(p.connected, false);
});

test('token present but no CONTREE_API_BASE => not connected with note; no fetch', async () => {
  let called = false;
  const p = await probe({ env: { CONTREE_API_TOKEN: TOKEN }, fetchImpl: () => { called = true; } });
  assert.equal(called, false);
  assert.equal(p.connected, false);
  assert.equal(p.detail, 'Token present; probe endpoint not configured');
  assert.equal(p.note, 'set CONTREE_API_BASE');
  assert.ok(!JSON.stringify(p).includes(TOKEN));
});

test('mock successful probe => Connected; GET only; token not in response', async () => {
  const calls = [];
  const p = await probe({
    env: { CONTREE_TOKEN: TOKEN, CONTREE_API_BASE: 'https://sandbox.example.test/health' },
    fetchImpl: async (url, init) => { calls.push({ url, init }); return { ok: true, status: 200 }; },
  });
  assert.equal(p.connected, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.method, 'GET');
  assert.ok(!JSON.stringify(p).includes(TOKEN));
  assert.equal(connectionRow(p).status, 'Connected');
});

test('failure messages never leak token', async () => {
  const p = await probe({
    env: { CONTREE_API_TOKEN: TOKEN, CONTREE_API_BASE: 'https://sandbox.example.test/x' },
    fetchImpl: async () => { throw new Error(`boom ${TOKEN}`); },
  });
  assert.equal(p.connected, false);
  assert.ok(!JSON.stringify(p).includes(TOKEN));
  const h = await probe({
    env: { CONTREE_API_TOKEN: TOKEN, CONTREE_API_BASE: 'https://sandbox.example.test/x' },
    fetchImpl: async () => ({ ok: false, status: 401 }),
  });
  assert.equal(h.connected, false);
  assert.match(h.detail, /401/);
});

test('capabilities labeled concept; execution not authorized', () => {
  const c = capabilities();
  assert.equal(c.label, 'concept');
  assert.equal(c.executionAuthorized, false);
  assert.deepEqual(c.items.map((i) => i.id), ['branch', 'rollback', 'vm-isolation', 'immutable-images']);
  for (const i of c.items) assert.equal(i.label, 'concept');
});

test('registry includes contree-sandbox Unconnected and keeps existing rows', () => {
  const ids = connectionRegistry().map((r) => r.id);
  for (const id of ['nebius-token-factory', 'nebius-inference', 'contree-sandbox', 'risc-zero', 'local-store']) assert.ok(ids.includes(id), id);
  assert.equal(connectionRegistry().find((r) => r.id === 'contree-sandbox').status, 'Unconnected');
});
