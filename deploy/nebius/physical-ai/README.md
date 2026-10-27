# deploy/nebius/physical-ai — NPA Workbench (NON-EXECUTING)

Planned Edge-Sentinel backing via <https://github.com/nebius/nebius-physical-ai>. Sim-only / hardware-gated.

- `example-workflow.yaml` is **fully commented out**: an excerpt of upstream
  `workflows/main/groot-1-7-finetune.yaml` (blob 72d3d04) for reference only. It is not a runnable workflow.
- Nirvana does not call `npa`, SkyPilot, or provision anything. JeV: NO EXECUTION AUTHORIZED.
- Any provisioning (`npa configure`, GPU clusters, object storage, SkyPilot submits) requires **explicit user
  approval** and **Nebius project access** (project admin for storage setup, per upstream), with spend reviewed first.
