# kvax on the Nirvana JAX/NVIDIA path — Planned / not configured

Upstream: https://github.com/nebius/kvax (Apache-2.0). Flash Attention 2 for JAX in Triton, with document masks, context parallelism, and FSDP/HSDP sharding support.

**Nothing in this directory executes.** Nirvana does not provision GPUs, build images, or submit jobs. The `kvax` connection row stays `Unconnected` (`lib/nirvana/kvax.mjs`).

## How it would plug in

- `../models/jax-maxtext-job.example.json` — an operator would add `kvax` to the job image (`pip install kvax`) and swap the attention op in the model code for `kvax.ops.flash_attention`.
- `../models/jax-triton.example.json` — the Triton JAX Python backend's model code would import kvax the same way. kvax is a library, not a separate service.
- Pin versions yourself: upstream warns the auto-installed Triton / JAX-Triton may be incompatible; its benchmarks used `triton==3.1` and `jax-triton==0.2.0`.

## Minimal usage (copied from upstream README, abridged; NOT run by Nirvana)

```python
# from kvax.utils import PADDING_SEGMENT_ID
# from kvax.ops import create_attention_mask, flash_attention
# from kvax.utils import attention_specs, permute_tokens_context_parallelism, unpermute_tokens_context_parallelism
#
# # Mark every padding token with PADDING_SEGMENT_ID in query_segment_ids and kv_segment_ids.
# # Build the mask once per forward/backward pass, then pass it to every attention layer:
# attention_mask = create_attention_mask(
#     query_positions, query_segment_ids, kv_positions, kv_segment_ids,
#     fwd_params=..., bwd_params=..., skip_pad_tokens=..., calc_bwd_mask=True,
# )
# attn_out = flash_attention(
#     query=query, key=key, value=value,
#     query_positions=..., query_segment_ids=..., kv_positions=kv_positions, kv_segment_ids=kv_segment_ids,
#     mask=attention_mask, assume_sequential_positions=..., scale=scale,
# )
#
# # Mesh is a global context:
# mesh = jax.sharding.Mesh(mesh_devices, mesh_names)
# with mesh, attention_specs(query_specs=("data", "context", None, None), kv_specs=("data", None, None, None)):
#     logits = Transformer(...)(embeddings, positions, segment_ids)
```

See the full example at the upstream README "How to use" section.

## Upstream limitations

No bias; no sliding window / ALiBi / custom masks; context parallelism does not shard across kv_sequence.

## Local probe (optional)

Set `KVAX_HOME` to a local checkout; the status route only `stat()`s it and still reports `Unconnected / Planned`.
