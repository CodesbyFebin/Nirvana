import { recordTorqueCheck } from '../../../../../lib/nirvana/store.mjs';
import { withNirvanaDb, jsonError, noStore } from '../../../../../lib/nirvana/http.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  return withNirvanaDb((db) => {
    try {
      const result = recordTorqueCheck(db, body);
      return Response.json(result, { headers: noStore });
    } catch (error) {
      return jsonError(error);
    }
  });
}
