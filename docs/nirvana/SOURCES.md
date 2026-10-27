# Sources and capability verification register

Checked through primary-source web retrieval on 27 October 2026. These links support design decisions; they do not establish this application's deployment capabilities. Re-check at implementation time and pin exact versions.

| Source | Design use | Still to verify |
|---|---|---|
| https://nebius.com/services/token-factory | Managed model inference | Account access, region, exact catalog IDs and pricing |
| https://nebius.com/services/token-factory/models/nvidia-nemotron-models-inference | NVIDIA model family integration | Tool/schema behavior and allowed data class per exact ID |
| https://github.com/nebius/nebius-physical-ai/blob/main/docs/workbench/token-factory.md | Catalog verification versus inference qualification | API entitlement and billed inference probe |
| https://dev.risczero.com/api/zkvm | Guest execution and receipt semantics | Pinned production guest/host version and real proof |
| https://docs.rs/risc0-zkvm/latest/risc0_zkvm/struct.Receipt.html | Image-bound verification | Explicit journal checks, trusted image policy, dev-mode rejection |
| https://kata-containers.github.io/kata-containers/use-cases/NVIDIA-GPU-passthrough-and-Kata-QEMU/ | GPU device and guest requirements | Selected cloud host supports required virtualization/device isolation |
| https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/deploy-kata-containers.html | GPU operator/Kata compatibility | Driver/runtime hardware compatibility and isolation on actual node |
| https://docs.celestia.org/learn/celestia-101/data-availability/ | DA is separate from execution/settlement | Client version, inclusion verification, fee and namespace policy |
| https://docs.celestia.org/learn/blobstream/ | Current docs label Blobstream legacy | Do not make it a dependency without a concrete bridge requirement |

## Claims intentionally unverified

No exact Nemotron model ID is certified by this package. No sub-500 ms SLO, 20-minute proof duration, 90/10 routing ratio, private managed endpoint topology, free included quota, GROOT/Cosmos deployment entitlement, physical device compatibility or universal Nebius product availability is assumed. No third-party deployment or paid infrastructure was created for this blueprint.
