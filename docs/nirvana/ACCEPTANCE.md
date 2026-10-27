# Evidence-based 100-point acceptance rubric

This is a target rubric, not a current score. Current production readiness: **not rated**. The prototype has no live backend evidence. Do not give partial points for prose, UI placeholders or unexecuted tests.

| Area | Points | Award only when |
|---|---:|---|
| Identity, tenancy and durable data | 12 | Multi-user isolation, session expiry, CSRF and database constraints pass |
| Durable orchestration and recovery | 10 | Crash, lease expiry, cancellation and uncertain-action reconciliation pass |
| Deterministic policy and approval binding | 14 | Replay, mutation, revocation, expiry and concurrency tests fail closed |
| Sandbox and tool isolation | 12 | Actual isolation host and adversarial escape/exfiltration tests pass |
| Inference correctness and budget controls | 8 | Catalog/inference qualified; budgets and approved fallback measured |
| Real zkVM and independent verification | 14 | Real receipts and all mismatch/dev/fake rejection tests pass |
| Artifact and audit provenance | 8 | Exact artifact chain, signing and independent export checks pass |
| Private memory and sovereignty boundary | 8 | Grant enforcement, deletion, key handling and data-flow inventory verified |
| Physical simulation and safe edge release | 6 | Reproducible simulation plus qualified device interlocks/OTA for physical claims |
| Operations, security review and recovery | 5 | Restore/load drills and independent review pass |
| UX, accessibility and truthful demo | 3 | Responsive keyboard flows and honest live evidence demonstrated |
| **Total** | **100** | All points require retained evidence |

## Mandatory blockers regardless of score

- Unauthenticated or cross-tenant action/data access.
- Approval replay or action mutation accepted.
- Fake/development/mismatched proof accepted for a protected release.
- Untrusted code reaches host secrets, metadata, another tenant or uncontrolled external targets.
- Unknown or unauthorized spending permitted under the configured budget policy.
- Physical action enabled without independent safety controls and hardware qualification.
- Claimed private/sovereign operation contradicted by unapproved data egress.
- Critical/high independent-review findings unresolved.
- Fabricated metrics or claims that pending tests passed.

A narrower coding-only release may have a separately named rubric with different weights. Do not call it 100/100 of this four-track rubric or silently count omitted tracks as passed.

## Evidence record template

```json
{
  "gate_id": "G7-03",
  "release_commit": "<full commit SHA>",
  "environment": {"runtime": "<version>", "region": "<observed>", "host": "<class>"},
  "executed_at": "<UTC ISO-8601>",
  "procedure": "<exact command or reproducible manual steps>",
  "result": "pass | fail | blocked | not_run",
  "expected": "<predicate>",
  "observed": "<actual observation>",
  "artifacts": [{"path": "<retained evidence>", "sha256": "<digest>"}],
  "reviewer": "<authenticated identity>",
  "limitations": ["<explicit remaining assumption>"]
}
```

Require positive tests, negative tests, concurrency tests and crash-boundary tests for each external-action path. Each protected action must be independently traceable to policy, immutable approved manifest, exact artifact, real verification outcome and observed target result.
