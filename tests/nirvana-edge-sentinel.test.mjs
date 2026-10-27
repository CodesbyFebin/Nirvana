import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { status, probe, capabilities, connectionRow, syncBridge, securityReportTemplate, emptyCveIndex } from '../lib/nirvana/edge-sentinel.mjs';
import { connectionRegistry } from '../lib/nirvana/store.mjs';

test('edge-sentinel default Unconnected, no scanner execution', async () => {
  const s = status();
  assert.equal(s.id, 'edge-sentinel-airgap');
  assert.equal(s.connected, false);
  assert.equal(s.scannerExecution, false);
  assert.equal((await probe({ env: {} })).connected, false);
  const r = await probe({ env: { EDGE_SENTINEL_CVE_INDEX: '/x' }, readImpl: async () => JSON.stringify(emptyCveIndex()) });
  assert.equal(r.connected, false);
  assert.equal(r.cveEntries, 0);
  const bad = await probe({ env: { EDGE_SENTINEL_CVE_INDEX: '/x' }, readImpl: async () => { throw new Error('no'); } });
  assert.equal(bad.cveEntries, null);
  assert.equal(connectionRow({ connected: true, detail: 'x' }).status, 'Unconnected');
});

test('capabilities labeled; sync fail-closed; report not from scan', () => {
  const c = capabilities();
  assert.equal(c.scannerExecution, false);
  for (const i of c.items) assert.ok(['Planned', 'concept'].includes(i.label), i.id);
  assert.equal(syncBridge().synced, false);
  const rep = securityReportTemplate({ findings: [{ asset: 'h1', cve: 'CVE-2024-0001' }] });
  assert.equal(rep.generated_by_scan, false);
  assert.equal(rep.findings[0].source, 'operator-supplied');
});

test('module source invokes no processes or scanner binaries', () => {
  const src = readFileSync(new URL('../lib/nirvana/edge-sentinel.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /child_process|spawn\(|exec\(|node:net|node:dgram/);
  for (const bin of ['nmap', 'aircrack', 'airodump', 'masscan', 'iwlist']) assert.ok(!src.includes(bin), bin);
});

test('registry has edge-sentinel + nebius console rows, all Unconnected', () => {
  const reg = connectionRegistry();
  for (const id of ['edge-sentinel-airgap', 'nebius-jobs', 'nebius-endpoints', 'kvax']) {
    assert.equal(reg.find((r) => r.id === id)?.status, 'Unconnected', id);
  }
});
