import { getFlow } from '../../../../../lib/nirvana/sdlc-flow.mjs';
import { withNirvanaDb, noStore } from '../../../../../lib/nirvana/http.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id || '')) return Response.json({ error: 'Invalid flow id' }, { status: 400 });
  return withNirvanaDb((db) => {
    const flow = getFlow(db, id);
    if (!flow) return Response.json({ error: 'Flow not found' }, { status: 404 });
    return Response.json({ flow }, { headers: noStore });
  });
}
