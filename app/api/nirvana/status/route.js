import { connectionRegistry } from '../../../../lib/nirvana/store.mjs';
import { noStore } from '../../../../lib/nirvana/http.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    product: 'Nirvana',
    tagline: 'Build with NVIDIA. Verify with RISC Zero. Own on Nebius.',
    delivery: 'local-full-stack-vertical-slice',
    notice: 'Cloud integrations are Planned / not configured. No fabricated live telemetry.',
    models: {
      museCode: 'light + task planning (local label)',
      museWonder: 'reasoning + multi-agent via Muse Code (local label)',
      graphEngine: 'graph + analysis tier (not a Meta product name)',
      nemotron: 'Planned — catalog discovery required; no hardcoded live IDs claimed',
    },
    pipeline: ['Perception', 'Reasoning', 'Report', 'Action'],
    gatekeeper: 'JeV / --mev',
    execution: { authorized: false, reason: 'NO EXECUTION AUTHORIZED' },
    zkvm: { status: 'Planned / not configured', proofs: 0 },
    connections: connectionRegistry(),
  }, { headers: noStore });
}
