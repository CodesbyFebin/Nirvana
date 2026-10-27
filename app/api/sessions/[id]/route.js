import { jules, sessionId, failure } from '../../../../lib/jules';

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    return Response.json(await jules('/sessions/' + sessionId(id)));
  } catch (e) { return failure(e); }
}
