import { getTask, getTaskRevision, listPendingApprovals } from '../../../../../lib/nirvana/store.mjs';
import { withNirvanaDb, noStore } from '../../../../../lib/nirvana/http.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, context) {
  const params = await context.params;
  const id = params?.id;
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    return Response.json({ error: 'Valid task UUID required' }, { status: 400 });
  }
  return withNirvanaDb((db) => {
    const task = getTask(db, id);
    if (!task) return Response.json({ error: 'Not found' }, { status: 404, headers: noStore });
    const revision = getTaskRevision(db, id, task.revision);
    const pending = listPendingApprovals(db).filter((a) => a.taskId === id);
    return Response.json({ task, revision, pendingApprovals: pending }, { headers: noStore });
  });
}
