import { listPendingApprovals, decideApproval } from '../../../../lib/nirvana/store.mjs';
import { withNirvanaDb, jsonError, noStore } from '../../../../lib/nirvana/http.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return withNirvanaDb((db) => Response.json({
    approvals: listPendingApprovals(db),
    notice: 'JeV desk — durable records only. NO EXECUTION AUTHORIZED.',
  }, { headers: noStore }));
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { approvalId, decision, expectedActionDigest } = body || {};
  if (!approvalId || !/^[0-9a-f-]{36}$/.test(approvalId)) {
    return Response.json({ error: 'Valid approvalId required' }, { status: 400 });
  }
  return withNirvanaDb((db) => {
    try {
      const result = decideApproval(db, { approvalId, decision, expectedActionDigest });
      return Response.json(result, { headers: noStore });
    } catch (error) {
      return jsonError(error);
    }
  });
}
