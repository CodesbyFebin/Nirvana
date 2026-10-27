// Nebius console surfaces (Job / Endpoint) — status-only rows. No create, provision, or API call.
// Grounded in what the operator's console showed; no Nebius API endpoint is assumed here.
const ROWS = [
  { id: 'nebius-jobs', name: 'Nebius Serverless AI — Job', detail: 'Train / finetune / batch / eval — Unconnected / Planned (nothing provisioned)' },
  { id: 'nebius-endpoints', name: 'Nebius Serverless AI — Endpoint', detail: 'Serve / realtime / A-B / prod APIs — Unconnected / Planned (nothing provisioned)' },
];
export function connectionRows() {
  return ROWS.map((r) => ({ ...r, status: 'Unconnected' }));
}
