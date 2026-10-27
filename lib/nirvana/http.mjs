import { openNirvanaDb } from './store.mjs';

export function withNirvanaDb(action) {
  let db;
  try {
    db = openNirvanaDb();
    return action(db);
  } catch (error) {
    if (error?.code === 'STORE_UNAVAILABLE' || error?.code === 'STORAGE_DENIED') {
      return Response.json({ error: error.message, code: error.code }, { status: 503 });
    }
    throw error;
  } finally {
    try { db?.close(); } catch { /* ignore */ }
  }
}

export function jsonError(error) {
  const status = Number(error?.status) || 500;
  const body = { error: error?.message || 'Internal error' };
  if (error?.code) body.code = error.code;
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export const noStore = { 'Cache-Control': 'no-store' };

/** Async variant: keeps the DB open until the action's promise settles. */
export async function withNirvanaDbAsync(action) {
  let db;
  try {
    db = openNirvanaDb();
    return await action(db);
  } catch (error) {
    if (error?.code === 'STORE_UNAVAILABLE' || error?.code === 'STORAGE_DENIED') {
      return Response.json({ error: error.message, code: error.code }, { status: 503 });
    }
    throw error;
  } finally {
    try { db?.close(); } catch { /* ignore */ }
  }
}
