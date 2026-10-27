# Nirvana — Sovereign Verifiable AI Cloud

Master blueprint and current prototype, 27 October 2026.

**Delivery status:** browser-local operator console; target cloud architecture is a design, not an implemented backend. “100/100” means the acceptance rubric in `docs/ACCEPTANCE.md`; no production score is awarded.

## Contents

- `prototype/index.html`: exact source snapshot of the currently published console.
- `docs/MASTER-BLUEPRINT.md`: product definition, trust model, deployment architecture, data contracts, execution flow, security, and operations.
- `docs/IMPLEMENTATION-TASKS.md` and `implementation-tasks.json`: sequenced backlog with dependencies, acceptance tests, and evidence requirements.
- `docs/ACCEPTANCE.md`: weighted 100-point rubric and mandatory release gates.
- `docs/CURRENT-STATE.md`: implemented behavior, limitations, defects to fix first, and honest verification status.
- `docs/DEMO-RUNBOOK.md`: a real-evidence hackathon demo plan.
- `docs/SOURCES.md`: primary documentation and assumptions requiring confirmation.
- `contracts/`: proposed JSON Schemas; contracts are not a running API.
- `tools/verify_bundle.py`: validate archive file checksums and check prototype JavaScript syntax if Node is installed.
- `SHA256SUMS`: content manifest, excluding itself.

## Run the current prototype

From this folder:

```bash
python3 -m http.server 8080 --bind 127.0.0.1 --directory prototype
```

Open **http://localhost:8080**. Modern browsers treat localhost as a secure context, needed for Web Crypto. Opening the file directly or using a plain HTTP LAN hostname is not the supported run path. Python 3 is the only server dependency; no installation is required. Fonts are requested from Google Fonts with system fallbacks; this is not a zero-egress build.

The prototype has no backend. Tasks and audit events are stored in this browser's localStorage. Do not enter secrets or personal memory. Approval is a local UI record, not authenticated production authorization. Export JSON from Evidence Ledger for a portable copy. There is no task import or sync feature.

Published private console: https://nirvana-sovereign-cloud.febinfrancis555.chatgpt.site

Source snapshot: Sites Git commit `ce768f748973e6f13936c413ded20e8ebf7781f8`.
The source is preserved byte-for-byte. No .git directory, access credentials, live runtime data, or hosting project identity is packaged.

## Start implementation

Read CURRENT-STATE first, then MASTER-BLUEPRINT, then complete tasks in dependency order. Start with G0 and G1; do not start by provisioning GPUs. Every gate must include source commit, executable test, environment, timestamp, and result. Unexecuted external gates remain pending.

The production implementation should preserve the Nirvana name and design, replace localStorage with authenticated server records, and keep external actions blocked until policy, scoped human approval where required, sandbox checks, and proof verification all pass.
