import { test } from 'node:test';
import assert from 'node:assert/strict';
import { examples } from '../lib/nirvana/token-factory.mjs';

test('examples() returns four not-run entries mapped to Nirvana modules', () => {
  const ex = examples();
  assert.equal(ex.length, 4);
  assert.deepEqual(ex.map((e) => [e.id, e.module]), [
    ['deep-research', 'sentinel-memory'], ['opencode', 'muse-claw-devops'],
    ['cost-benchmark', 'dragon-router'], ['confidence-gated', 'jev-gatekeeper'],
  ]);
  for (const e of ex) {
    assert.equal(e.status, 'not-run');
    assert.equal(e.measured, null);
    assert.match(e.upstreamUrl, /^https:\/\/github\.com\/nebius\/token-factory-cookbook\//);
    for (const k of ['cost', 'latency', 'tokens', 'correctness', 'costUsd', 'latencyMs']) assert.ok(!(k in e));
  }
});

test('examples() makes no network calls', () => {
  const orig = globalThis.fetch; let called = false;
  globalThis.fetch = () => { called = true; throw new Error('no'); };
  try { examples(); } finally { globalThis.fetch = orig; }
  assert.equal(called, false);
});
