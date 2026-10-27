# Current state and gap register

## Snapshot

This package includes the static HTML/CSS/JavaScript console published on Sites, not a Nebius deployment. Source commit: `ce768f748973e6f13936c413ded20e8ebf7781f8`. Export date: 2026-10-27. No functional backend, infrastructure provisioning, trained model, ZK guest, or hardware integration is included.

| Capability | Present in source | Evidence / limit |
|---|---|---|
| Mission control, topology, responsive navigation | Yes | Browser preview rendered; topology is an architecture illustration |
| Task intake / scope classification | Yes | Deterministic classification from user-selected scope; not model inference |
| Approval / rejection | Yes | Local operator record only; not authenticated or server-enforced |
| Local audit SHA-256 links / export | Yes | Hashes are recomputable by the browser owner; not signatures or ZK proofs |
| Physical torque limit check | Yes | Scalar arithmetic; not dynamics, perception, simulation, or robot safety assurance |
| Memory view and infrastructure registry | Yes | Read-only descriptions of unconnected integrations |
| Nebius inference / worker / GPU | No | Credentials, account and runtime needed |
| PostgreSQL / TBAC / authentication | No | No server data boundary |
| RISC Zero receipts / Celestia submission | No | No verifier or chain integration |
| Simulation / OTA / robot | No | No device, simulator, calibration, or hardware interlock |

## Verification already performed

- Preview startup succeeded and overview rendered in browser.
- Task dialog opened and accepted field values.
- Preview task submission did **not** visibly complete on plain HTTP `terminal.local`; full task workflow was not verified. Web Crypto secure-context requirements are a likely cause, not a proven diagnosis.
- Private deployment returned `succeeded` from Sites.
- Browser visit to published URL reached the expected private sign-in gate; no authenticated production workflow testing was completed.
- Bundle verification checks syntax, checksums, source snapshot identity, and schema serialization. It does not certify application workflows.

## Defects / hardening to implement before live usage

1. Show an actionable secure-context / crypto availability error before task creation. Fail before state mutation when hashing cannot run.
2. Save a complete task+event transaction atomically. Current code mutates in-memory arrays before hash/storage succeeds; failures can leave partial state.
3. Handle storage exhaustion, denied storage, corrupted nested records, and cross-tab writers. Current top-level array checks are insufficient.
4. Serialize every audit write, including physical checks; the current global busy flag does not cover all event producers. Two writers can race on the previous hash.
5. Handle rejected async operations in physical checks and ledger verification. Add visible loading, success, and failure states.
6. Replace browser operator identity with authenticated server identity and server-enforced tenant policies.
7. Bind approvals to immutable task/artifact digests, expiry, scope and nonce. UI IDs and mutable localStorage are not authorization boundaries.
8. Remove external fonts for a self-hosted zero-egress target; apply CSP and security headers after hosting migration.
9. Test keyboard navigation, focus management, narrow displays, long inputs, export, persistence and status filters.
10. Retain zero fabricated metrics; only show runtime status when observed from an authenticated source.

Do not market this snapshot as a sovereign cloud, cryptographically verified agent platform, or production safety system. It is a useful operator-interface foundation.
