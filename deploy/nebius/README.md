# Nebius deploy stubs (Nirvana)

**Do not terraform-apply from this directory.** These files are operator templates that
point at the official Nebius Solution Library.

Upstream: https://github.com/nebius/nebius-solutions-library

| Path | Role |
|---|---|
| `k8s-inference/` | Multi-region GPU inference fleet — `POST /v1/models` registers any container |
| `k8s-training/` | Training cluster (GPU-Operator + Network-Operator / InfiniBand) |
| `gpu_slicing/` | MIG / MPS / timeslice sharing |

Nirvana intentionally **does not vendor** the Terraform/Helm tree. Copy
`terraform.tfvars.nirvana.example` into a checkout of `k8s-inference/`, fill project IDs,
and follow that repo’s README / `stack.sh`.

Model examples:

- `models/jax-triton.example.json` — Triton + JAX HTTP endpoint (`kind: endpoint`)
- `models/jax-maxtext-job.example.json` — MaxText-style long Job (`mode: run` / container-run)

Images are placeholders. Pin digests you build before any register call.

See `docs/nirvana/JAX-NVIDIA-NEBIUS.md` for the full runbook and qualification checklist.
Nebius stays Unconnected / Planned in-app until a read-only probe succeeds.
