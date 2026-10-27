import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_BASE_URL,
  ROLE_DEFAULTS,
  tokenFactoryConfig,
  status,
  probe,
  roleModelMap,
  connectionRow,
} from '../lib/nirvana/token-factory.mjs';
import { connectionRegistry } from '../lib/nirvana/store.mjs';

test('no NEBIUS_API_KEY => disconnected / Planned', () => {
  const s = status({});
  assert.equal(s.connected, false);
  assert.equal(s.status, 'Unconnected');
  assert.match(s.detail, /Unconnected \/ Planned/);
  assert.equal(s.id, 'nebius-token-factory');
  const cfg = tokenFactoryConfig({});
  assert.equal(cfg.hasKey, false);
  assert.equal(cfg.baseUrl, DEFAULT_BASE_URL.replace(/\/+$/, '') + '/');
});

test('key set without probe stays Unconnected', () => {
  const s = status({ NEBIUS_API_KEY: 'sk-test-key' });
  assert.equal(s.connected, false);
  assert.match(s.detail, /Unconnected|probe/i);
});

test('custom base URL normalized with trailing slash', () => {
  const cfg = tokenFactoryConfig({
    NEBIUS_API_KEY: 'sk-x',
    NEBIUS_TOKEN_FACTORY_BASE_URL: 'https://api.example.test/v1',
  });
  assert.equal(cfg.baseUrl, 'https://api.example.test/v1/');
  assert.equal(cfg.hasKey, true);
});

test('probe success => Connected; observes model count; never invents; never echoes key', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return {
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          { id: 'nvidia/Nemotron-3-Ultra-550b-a55b' },
          { id: 'nvidia/nemotron-3-super-120b-a12b' },
          { id: 'nvidia/Nemotron-3_5-Lightning' },
          { id: 'other/model' },
        ],
      }),
    };
  };
  const env = {
    NEBIUS_API_KEY: 'sk-SECRETVALUE_DO_NOT_LEAK',
    NEBIUS_TOKEN_FACTORY_BASE_URL: 'https://api.tokenfactory.us-central1.nebius.com/v1/',
  };
  const result = await probe({ env, fetchImpl, timeoutMs: 1000 });
  assert.equal(result.connected, true);
  assert.equal(result.status, 'Connected');
  assert.equal(result.modelCount, 4);
  assert.ok(Array.isArray(result.modelIdsSample));
  assert.equal(result.modelIdsSample[0], 'nvidia/Nemotron-3-Ultra-550b-a55b');
  assert.ok(result.observedAt);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.tokenfactory.us-central1.nebius.com/v1/models');
  assert.equal(calls[0].init.method, 'GET');
  assert.match(calls[0].init.headers.Authorization, /^Bearer sk-SECRET/);
  const dumped = JSON.stringify(result);
  assert.equal(dumped.includes('SECRETVALUE'), false);
  assert.equal(dumped.includes('sk-SECRET'), false);
  assert.equal('key' in result, false);
  assert.equal('apiKey' in result, false);
});

test('probe HTTP 401 => Unconnected; no key material in response', async () => {
  const result = await probe({
    env: { NEBIUS_API_KEY: 'sk-LEAKME1234567890abcdefghij' },
    fetchImpl: async () => ({ ok: false, status: 401, json: async () => ({ error: 'unauthorized' }) }),
  });
  assert.equal(result.connected, false);
  assert.equal(result.status, 'Unconnected');
  assert.match(result.detail, /401|Unconnected/);
  const dumped = JSON.stringify(result);
  assert.equal(dumped.includes('sk-LEAKME'), false);
  assert.equal(dumped.includes('LEAKME1234567890'), false);
});

test('probe network error redacts secrets from detail', async () => {
  const result = await probe({
    env: { NEBIUS_API_KEY: 'sk-LEAKME1234567890abcdefghij' },
    fetchImpl: async () => {
      throw new Error('fetch failed Authorization: Bearer sk-LEAKME1234567890abcdefghij');
    },
  });
  assert.equal(result.connected, false);
  assert.equal(result.detail.includes('sk-LEAKME'), false);
  assert.match(result.detail, /redacted|Probe failed/i);
});

test('roleModelMap defaults_unverified without probe', () => {
  const map = roleModelMap(null);
  assert.equal(map.label, 'defaults_unverified');
  assert.equal(map.roles.length, 3);
  assert.equal(map.roles.find((r) => r.role === 'planner').modelId, ROLE_DEFAULTS.planner.modelId);
  assert.equal(map.roles.find((r) => r.role === 'coder').modelId, ROLE_DEFAULTS.coder.modelId);
  assert.equal(map.roles.find((r) => r.role === 'router').modelId, ROLE_DEFAULTS.router.modelId);
  for (const r of map.roles) {
    assert.equal(r.note, 'defaults_unverified');
    assert.equal(r.present, null);
  }
});

test('roleModelMap confirms IDs present in catalog sample', () => {
  const map = roleModelMap({
    connected: true,
    modelCount: 3,
    modelIdsSample: [
      ROLE_DEFAULTS.planner.modelId,
      ROLE_DEFAULTS.coder.modelId,
      ROLE_DEFAULTS.router.modelId,
    ],
  });
  assert.equal(map.label, 'role_map_after_probe');
  for (const r of map.roles) {
    assert.equal(r.present, true);
  }
});

test('roleModelMap marks missing ID — no silent fallback', () => {
  const map = roleModelMap({
    connected: true,
    modelCount: 1,
    modelIdsSample: ['completely/other-model'],
  });
  const planner = map.roles.find((r) => r.role === 'planner');
  assert.equal(planner.present, false);
  assert.match(planner.note, /missing_from_catalog|abort/i);
});

test('connectionRegistry includes nebius-token-factory Unconnected by default', () => {
  const rows = connectionRegistry();
  const tf = rows.find((r) => r.id === 'nebius-token-factory');
  const fleet = rows.find((r) => r.id === 'nebius-inference');
  assert.ok(tf, 'token-factory row present');
  assert.ok(fleet, 'k8s-inference fleet row still present');
  assert.equal(tf.status, 'Unconnected');
  assert.match(tf.detail, /Planned|Unconnected/);
  assert.equal(JSON.stringify(rows).includes('sk-'), false);
  // Distinct rows — not duplicated confusingly
  assert.equal(rows.filter((r) => r.id === 'nebius-token-factory').length, 1);
});

test('connectionRegistry accepts probed Connected tokenFactory row', () => {
  const row = connectionRow({
    id: 'nebius-token-factory',
    name: 'Nebius Token Factory (Nemotron, OpenAI-compatible)',
    connected: true,
    status: 'Connected',
    detail: 'GET /models ok; 3 model(s) observed (list only — no chat.completions)',
  });
  const rows = connectionRegistry({ tokenFactory: row });
  const found = rows.find((r) => r.id === 'nebius-token-factory');
  assert.equal(found.status, 'Connected');
});

test('probe without key never calls fetch', async () => {
  let called = false;
  const result = await probe({
    env: {},
    fetchImpl: async () => {
      called = true;
      return { ok: true, status: 200, json: async () => ({ data: [] }) };
    },
  });
  assert.equal(called, false);
  assert.equal(result.connected, false);
});
