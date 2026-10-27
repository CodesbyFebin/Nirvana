import { exportEvidence } from '../../../../../lib/nirvana/store.mjs';
import { withNirvanaDb, noStore } from '../../../../../lib/nirvana/http.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return withNirvanaDb((db) => Response.json(exportEvidence(db), {
    headers: {
      ...noStore,
      'Content-Disposition': 'attachment; filename="nirvana-evidence.json"',
    },
  }));
}
