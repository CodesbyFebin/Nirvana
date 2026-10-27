'use client';

/** Neon operator-console palette (cyan + green on teal/navy). */
export const theme = {
  bg: '#020b12',
  bgDeep: '#01070d',
  panel: 'rgba(6, 22, 34, 0.92)',
  panelSolid: '#061622',
  panelBorder: 'rgba(34, 211, 238, 0.28)',
  panelBorderStrong: 'rgba(34, 211, 238, 0.55)',
  tile: 'rgba(4, 18, 28, 0.9)',
  cyan: '#22d3ee',
  cyanSoft: '#67e8f9',
  cyanDim: '#0891b2',
  green: '#4ade80',
  greenSoft: '#86efac',
  greenDim: '#16a34a',
  accent: '#22d3ee',
  accentDim: '#0891b2',
  accentSoft: '#a5f3fc',
  muted: '#7a93a8',
  text: '#e6f4ff',
  warn: '#fbbf24',
  warnBg: 'rgba(120, 53, 15, 0.45)',
  danger: '#f87171',
  concept: '#64748b',
  glowCyan: '0 0 18px rgba(34, 211, 238, 0.35)',
  glowGreen: '0 0 18px rgba(74, 222, 128, 0.3)',
};

/** Concept/target presentation numbers for the operator mock (not live telemetry). */
export const CONCEPT_FLEET = {
  clans: 10,
  specialists: 500,
  working: 35,
  queued: 465,
  label: 'concept / target — not live telemetry',
};

export function Badge({ children, tone = 'planned' }) {
  const colors = {
    planned: { bg: 'rgba(8,40,50,0.9)', fg: '#67e8f9', border: 'rgba(34,211,238,0.4)' },
    live: { bg: 'rgba(6,46,30,0.9)', fg: '#4ade80', border: 'rgba(22,163,74,0.55)' },
    warn: { bg: 'rgba(66,32,6,0.9)', fg: '#fbbf24', border: 'rgba(180,83,9,0.55)' },
    concept: { bg: 'rgba(15,23,42,0.9)', fg: '#94a3b8', border: '#334155' },
    muted: { bg: 'rgba(15,15,15,0.8)', fg: '#a3a3a3', border: '#404040' },
    working: { bg: 'rgba(6,46,30,0.85)', fg: '#4ade80', border: 'rgba(74,222,128,0.45)' },
  };
  const c = colors[tone] || colors.muted;
  return (
    <span style={{
      display: 'inline-block', fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
      padding: '2px 7px', borderRadius: 999, background: c.bg, color: c.fg,
      border: `1px solid ${c.border}`, marginLeft: 6, verticalAlign: 'middle', textTransform: 'uppercase',
    }}>{children}</span>
  );
}

export const panelStyle = {
  background: theme.panel,
  border: `1px solid ${theme.panelBorder}`,
  borderRadius: 10,
  padding: 10,
  boxShadow: 'inset 0 0 0 1px rgba(34,211,238,0.06), 0 0 20px rgba(0,0,0,0.35)',
};

export const h3Style = {
  margin: '0 0 6px',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.8,
  color: theme.cyanSoft,
  textTransform: 'uppercase',
};
