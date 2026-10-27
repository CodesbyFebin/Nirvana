import { connectionRegistry } from '../../../../lib/nirvana/store.mjs';
import { probe as probeNebius } from '../../../../lib/nirvana/nebius-inference.mjs';
import { probe as probeTokenFactory, roleModelMap, examples as tokenFactoryExamples } from '../../../../lib/nirvana/token-factory.mjs';
import { probe as probeContree, capabilities as contreeCapabilities } from '../../../../lib/nirvana/contree.mjs';
import { probe as probeKvax, capabilities as kvaxCapabilities } from '../../../../lib/nirvana/kvax.mjs';
import { probe as probePhysicalAi, capabilities as physicalAiCapabilities } from '../../../../lib/nirvana/physical-ai.mjs';
import { noStore } from '../../../../lib/nirvana/http.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  // Probes are read-only GET /models (or /v1/models). Never chat.completions, never spends.
  const [nebius, tokenFactory, contree, physicalAi, kvax] = await Promise.all([probeNebius(), probeTokenFactory(), probeContree(), probePhysicalAi(), probeKvax()]);
  const roleMap = roleModelMap(tokenFactory);
  return Response.json({
    product: 'Nirvana',
    tagline: 'Build with NVIDIA. Verify with RISC Zero. Own on Nebius.',
    delivery: 'local-full-stack-vertical-slice',
    notice: 'Cloud integrations are Planned / not configured. No fabricated live telemetry.',
    models: {
      museCode: 'light + task planning (local label)',
      museWonder: 'reasoning + multi-agent via Muse Code (local label)',
      graphEngine: 'graph + analysis tier (not a Meta product name)',
      nemotron: 'Planned — Token Factory role map is defaults_unverified until NEBIUS_API_KEY + probe; see docs/nirvana/TOKEN-FACTORY.md',
      jaxOnNvidia: 'Planned — MaxText Job and/or Triton JAX backend via Nebius k8s-inference; see docs/nirvana/JAX-NVIDIA-NEBIUS.md',
    },
    tokenFactoryRoles: roleMap,
    tokenFactoryExamples: tokenFactoryExamples(),
    sandbox: { provider: 'ConTree (Early Access)', capabilities: contreeCapabilities(), executionAuthorized: false },
    kvax: { provider: 'kvax FlashAttention for JAX (Nebius)', gpuAcceleration: 'Planned / not configured', capabilities: kvaxCapabilities(), executionAuthorized: false },
    physicalAi: { provider: 'Nebius Physical AI Workbench (NPA)', mode: 'sim-only / hardware-gated', capabilities: physicalAiCapabilities(), executionAuthorized: false },
    pipeline: ['Perception', 'Reasoning', 'Report', 'Action'],
    gatekeeper: 'JeV / --mev',
    execution: { authorized: false, reason: 'NO EXECUTION AUTHORIZED' },
    zkvm: { status: 'Planned / not configured', proofs: 0 },
    connections: connectionRegistry({ nebius, tokenFactory, contree, physicalAi, kvax }),
  }, { headers: noStore });
}
