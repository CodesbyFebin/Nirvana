# Edge-Sentinel air-gapped edge mode (`edge-sentinel-airgap`)

**Status: Unconnected / Planned.** Defensive and architectural only. Nirvana runs **no** network
scans, **no** wireless tooling, and contains **no** exploit or unauthorized-access code.
Module: `lib/nirvana/edge-sentinel.mjs` (status / probe / capabilities; never spawns processes).

Prior art: architecture loosely inspired by a public hackathon project on air-gapped Raspberry Pi
blue-team tooling. Code, naming, and text here are Nirvana's own.

| Capability | Nirvana plane | Status |
| --- | --- | --- |
| Air-gapped edge mode | Edge-Sentinel runs offline with a local knowledge base | Planned |
| Local CVE catalog | `contracts/LocalCveIndexV1.schema.json`, empty seed, operator-imported; optional `EDGE_SENTINEL_CVE_INDEX` read-only probe | Planned |
| Discovery report plane | Ingests host/service inventory **reports** for networks the operator owns; Nirvana executes no scanner | Planned |
| Edge device health | `contracts/EdgeHealthV1.schema.json` — CPU / network / boot-log | Planned |
| Sync bridge | EvidenceEnvelopes from air-gap → cloud store when connectivity returns; `syncBridge()` always refuses (fail-closed) | Planned |
| Security report | `securityReportTemplate()` — EvidenceEnvelope-compatible blue-team findings, `generated_by_scan: false` | concept |

Honesty:
- No live scans, no live NVD fetch, no telemetry is claimed. Any finding is `source: operator-supplied`.
- Only assets the operator owns or is authorized to assess are in scope.
- Any future action passes JeV — **NO EXECUTION AUTHORIZED**.
