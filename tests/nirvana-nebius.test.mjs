import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  nebiusConfig, status, probe, connectionRow,
} from '../lib/nirvana/nebius-inference.mjs';
import { connectionRegistry } from '../lib/nirvana/store.mjs';

test('unset env => disconnected / Planned', () => {
  const s = status({});
  assert.equal(s.connected, false);
  assert.equal(s.status, 'Unconnected');
  assert.match(s.detail, /Unconnected \/ Planned/);
  const cfg = nebiusConfig({});
  assert.equal(cfg.url, null);
  assert.equal(cfg.hasKey, false);
});

test('URL without probe stays Unconnected', () => {
  const s = status({ NEBIUS_INFERENCE_API_URL: 'https://api.example.test' });
  assert.equal(s.connected, false);
  assert.match(s.detail, /not probed|Unconnected/i);
});

test('probe success => Connected; observes models; never invents', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return {
      ok: true,
      status: 200,
      json: async () => ({
        models: [
          { id: 'hello-run', kind: 'job' },
          { id: 'container-run', kind: 'job' },
        ],
      }),
    };
  };
  const env = {
    NEBIUS_INFERENCE_API_URL: 'https://api.example.test/',
    NEBIUS_INFERENCE_API_KEY: 'sk-SECRETVALUE_DO_NOT_LEAK',
  };
  const result = await probe({ env, fetchImpl, timeoutMs: 1000 });
  assert.equal(result.connected, true);
  assert.equal(result.status, 'Connected');
  assert.equal(result.modelCount, 2);
  assert.equal(result.models[0].id, 'hello-run');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.example.test/v1/models');
  assert.equal(calls[0].init.method, 'GET');
  assert.match(calls[0].init.headers.Authorization, /^Bearer sk-SECRET/);
  // Response must never echo the secret
  const dumped = JSON.stringify(result);
  assert.equal(dumped.includes('SECRETVALUE'), false);
  assert.equal(dumped.includes('sk-SECRET'), false);
  assert.equal('key' in result, false);
});

test('probe HTTP failure => Unconnected', async () => {
  const result = await probe({
    env: { NEBIUS_INFERENCE_API_URL: 'https://api.example.test' },
    fetchImpl: async () => ({ ok: false, status: 503, json: async () => ({}) }),
  });
  assert.equal(result.connected, false);
  assert.equal(result.status, 'Unconnected');
  assert.match(result.detail, /503|Unconnected/);
});

test('probe network error => Unconnected; secrets redacted from detail', async () => {
  const result = await probe({
    env: {
      NEBIUS_INFERENCE_API_URL: 'https://api.example.test',
      NEBIUS_INFERENCE_API_KEY: 'sk-LEAKME1234567890abcdefghij',
    },
    fetchImpl: async () => {
      throw new Error('fetch failed Authorization: Bearer sk-LEAKME1234567890abcdefghij');
    },
  });
  assert.equal(result.connected, false);
  assert.equal(result.detail.includes('sk-LEAKME'), false);
  assert.match(result.detail, /redacted|Probe failed/i);
});

test('connectionRegistry includes nebius-inference Unconnected by default', () => {
  const rows = connectionRegistry();
  const row = rows.find((r) => r.id === 'nebius-inference');
  assert.ok(row);
  assert.equal(row.status, 'Unconnected');
  assert.match(row.detail, /Planned|Unconnected/);
  // No secrets in registry dump
  assert.equal(JSON.stringify(rows).includes('sk-'), false);
});

test('connectionRegistry accepts probed Connected row', () => {
  const row = connectionRow({
    id: 'nebius-inference',
    name: 'Nebius GPU inference (k8s-inference / Serverless AI)',
    connected: true,
    status: 'Connected',
    detail: 'GET /v1/models ok; 0 model(s) observed (status/probe only — no invoke)',
  });
  const rows = connectionRegistry({ nebius: row });
  const found = rows.find((r) => r.id === 'nebius-inference');
  assert.equal(found.status, 'Connected');
});

test('empty observed catalog still Connected when HTTP ok (no invented models)', async () => {
  const result = await probe({
    env: { NEBIUS_INFERENCE_API_URL: 'https://api.example.test' },
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      json: async () => ({ models: [] }),
    }),
  });
  assert.equal(result.connected, true);
  assert.equal(result.modelCount, 0);
  assert.deepEqual(result.models, []);
});
