# MetaPen — Kubernetes Deployment (`deploy/`)

Self-hostable AI pentesting swarm. **10 claws × 50 agents = 500 agents**, each
agent masters **exactly one tool**, running in a sandbox (Kata/Firecracker
microVM) with a human **JeV (`--mev`) approval gate** and **PLANNED** zkVM hash
receipts.

> ⚠️ **Honest status — read first**
> - **Lab-only.** Scope is enforced (`scope.yaml` required, owned-lab
>   NetworkPolicy), but **review everything before any real use**.
> - **zkVM is PLANNED, not built.** The `zk-proof-sidecar` only SHA256-hashes
>   logs today. Real Groth16/KECCAK256 proofs + Qdrant/Celestia anchoring are a
>   roadmap item. Nothing here claims "VERIFIED".
> - The 500 roster includes **clearly-marked placeholder slots** (`<domain>-slot-NN`).
>   Of 500 agents, **390 map to real named tools** and **110 are empty placeholders**
>   (padding to 50/claw). Placeholders are NOT live workers.

## File tree

```
deploy/
├── README.md
├── scripts/
│   └── gen-agent-prompts.mjs          # reads lib/claws.mjs -> 500-key ConfigMap
├── docker/
│   ├── Dockerfile.kali-agent          # custom Kali image (tool-executor)
│   ├── Dockerfile.bridge              # Central Brain bridge (minimal)
│   └── entrypoint.sh                  # refuses to run without scope.yaml
├── k8s/
│   ├── agent-prompts.configmap.yaml   # GENERATED — 500 mastery prompts
│   ├── agent-pod.template.yaml        # Kata pod: tool-executor + zk sidecar
│   ├── networkpolicy-owned-lab.yaml   # default-deny + owned-lab egress only
│   └── swarm-job.yaml                 # parallelism:50 / completions:500
└── helm/metapen/
    ├── Chart.yaml
    ├── values.yaml
    ├── files/agent-prompts.data.yaml  # generated data block for the chart
    └── templates/                     # ConfigMap, Job, NetworkPolicy, SA, helpers
```

## 1. Render the 500 agent prompts

```bash
node deploy/scripts/gen-agent-prompts.mjs
# -> deploy/k8s/agent-prompts.configmap.yaml (500 keys)
# Keep the Helm asset in sync:
sed 's/^  //' deploy/k8s/agent-prompts.configmap.yaml \
  | awk 'f{print} /^data:/{f=1}' > deploy/helm/metapen/files/agent-prompts.data.yaml
```

Each key is `<TOOL>-PRIME` (named tools) or `<domain>-slot-NN` (placeholders).
Every prompt bakes in the guardrails: owned-lab scope is law, auth file required,
no exploitation without JeV approval.

## 2. Build the images

```bash
docker build -f deploy/docker/Dockerfile.kali-agent -t ghcr.io/metapen/kali-agent:latest .
docker build -f deploy/docker/Dockerfile.bridge      -t ghcr.io/metapen/bridge:latest .
```

See the tool-install matrix comment at the top of `Dockerfile.kali-agent`:
most Kali tools install cleanly via apt; Foundry, slither/mythril, pacu/prowler,
and the Rust toolchain need extra steps (handled in the Dockerfile, tolerant of
build-time failures — review logs). Burp/Ghidra/IDA are **not** baked in.

## 3. Self-host

Quick local scale-out (app layer, not the microVM swarm):

```bash
docker compose up --scale agent=50
# offline CSP: default-src 'none'; no CDN
```

Kubernetes (requires a Kata-enabled cluster + a `scope.yaml` Secret):

```bash
kubectl create secret generic metapen-scope --from-file=scope.yaml=./scope.yaml
kubectl apply -f deploy/k8s/agent-prompts.configmap.yaml
kubectl apply -f deploy/k8s/networkpolicy-owned-lab.yaml
kubectl apply -f deploy/k8s/swarm-job.yaml
```

Or via Helm:

```bash
helm lint deploy/helm/metapen
helm install metapen deploy/helm/metapen \
  --set ownedLabCidr=10.100.0.0/16 \
  --set swarm.parallelism=50 \
  --set zkvm.enabled=false
```

## 4. Cloud (EKS / GKE)

- Managed cluster + **Kata Containers** runtime class (Firecracker).
- **Karpenter** (EKS) / node auto-provisioning (GKE) for burst to 50 parallel pods.
- Receipts backends (toggle in `values.yaml`): **Qdrant** (vectors), **Redis**
  (mission packets), **S3** (receipt blobs). All default OFF.
- **Istio mTLS** + **OPA/Gatekeeper** recommended for the control plane.

## 5. Concurrency & cost

- `parallelism: 50` is the Kubernetes batch cap (WAF-trigger / hardware-melt
  guard); `swarm.concurrencyCap: 32` is the application-layer active cap
  ("32 active / 500 pooled").
- Rough cost: **~32 active × 1 vCPU ≈ \$0.50/hr** on commodity spot/on-demand
  (excludes storage, egress, and managed add-ons). Validate against your cloud.

## 6. Guardrails (enforced + planned)

| Guardrail | Status |
| --- | --- |
| `scope.yaml` required before exec | Enforced (entrypoint exits 78 if missing) |
| Owned-lab egress only | Enforced (NetworkPolicy; edit CIDR) |
| Metadata endpoint blocked (169.254.169.254) | Enforced (NetworkPolicy `except`) |
| No exploitation without JeV approval | Baked into every prompt; gate is app-layer |
| microVM isolation per agent | Enforced (`runtimeClassName: kata`) |
| zkVM hash receipts | **PLANNED** (SHA256 stub only) |
