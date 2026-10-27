/**
 * Deterministic Dragon Router scope classification.
 * Not model inference — local policy only.
 */
export const SCOPES = Object.freeze({
  read: {
    id: 'read',
    label: 'Read-only analysis',
    tier: 0,
    requiresApproval: false,
    statusOnCreate: 'Ready — runtime unconnected',
  },
  write: {
    id: 'write',
    label: 'Code or data modification',
    tier: 1,
    requiresApproval: true,
    statusOnCreate: 'Awaiting approval',
  },
  deploy: {
    id: 'deploy',
    label: 'Deployment / physical action',
    tier: 3,
    requiresApproval: true,
    statusOnCreate: 'Awaiting approval',
  },
});

export const MODULES = Object.freeze([
  'Muse-Claw DevOps',
  'Dragon Router',
  'Sentinel-Memory',
  'Edge-Sentinel',
]);

export function classifyScope(scopeId) {
  const scope = SCOPES[scopeId];
  if (!scope) throw Object.assign(new Error('Invalid action scope'), { status: 400 });
  return scope;
}

export function assertModule(name) {
  if (!MODULES.includes(name)) throw Object.assign(new Error('Unknown specialist module'), { status: 400 });
  return name;
}
