import { startFlowWithInference, listFlows, STAGE_DEFS, FLOW_NOTICE } from '../../../../lib/nirvana/sdlc-flow.mjs';
import { withNirvanaDb, withNirvanaDbAsync, jsonError, noStore } from '../../../../lib/nirvana/http.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Auth (HTTP Basic) and same-origin mutation guard are enforced for all routes by proxy.js.

export async function GET() {
  return withNirvanaDb((db) => Response.json({
    flows: listFlows(db),
    stages: STAGE_DEFS,
    notice: FLOW_NOTICE,
  }, { headers: noStore }));
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  return withNirvanaDbAsync(async (db) => {
    try {
      return Response.json({ flow: await startFlowWithInference(db, body) }, { status: 201, headers: noStore });
    } catch (error) {
      return jsonError(error);
    }
  });
}
