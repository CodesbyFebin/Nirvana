import { listEvents, verifyAuditChain } from '../../../../lib/nirvana/store.mjs';
import { withNirvanaDb, noStore } from '../../../../lib/nirvana/http.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const limit = new URL(request.url).searchParams.get('limit');
  return withNirvanaDb((db) => {
    const verification = verifyAuditChain(db);
    return Response.json({
      events: listEvents(db, { limit: limit ? Number(limit) : 200 }),
      chainVerification: verification,
      notice: 'SHA-256 hash chain — not signatures or ZK proofs.',
    }, { headers: noStore });
  });
}
