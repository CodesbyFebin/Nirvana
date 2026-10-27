import { createTask, listTasks } from '../../../../lib/nirvana/store.mjs';
import { withNirvanaDb, jsonError, noStore } from '../../../../lib/nirvana/http.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const status = new URL(request.url).searchParams.get('status') || undefined;
  return withNirvanaDb((db) => Response.json({
    tasks: listTasks(db, { status }),
    notice: 'Durable server records. Counts are real for this store, not cloud fleet telemetry.',
  }, { headers: noStore }));
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  return withNirvanaDb((db) => {
    try {
      const result = createTask(db, body);
      return Response.json(result, { status: 201, headers: noStore });
    } catch (error) {
      return jsonError(error);
    }
  });
}
