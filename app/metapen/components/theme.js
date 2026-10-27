'use client';

export const theme = {
  bg: '#050a07',
  panel: '#08140e',
  panelBorder: '#1a3d28',
  tile: '#07110c',
  accent: '#4ade80',
  accentDim: '#16a34a',
  accentSoft: '#86efac',
  muted: '#7d9585',
  text: '#e8f5ec',
  warn: '#fbbf24',
  danger: '#f87171',
  concept: '#64748b',
};

export function Badge({ children, tone = 'planned' }) {
  const colors = {
    planned: { bg: '#1a2e1a', fg: '#86efac', border: '#166534' },
    live: { bg: '#052e1a', fg: '#4ade80', border: '#16a34a' },
    warn: { bg: '#2a2410', fg: '#fbbf24', border: '#854d0e' },
    concept: { bg: '#0f172a', fg: '#94a3b8', border: '#334155' },
    muted: { bg: '#1a1a1a', fg: '#a3a3a3', border: '#404040' },
  };
  const c = colors[tone] || colors.muted;
  return (
    <span style={{
      display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: 0.4,
      padding: '2px 7px', borderRadius: 999, background: c.bg, color: c.fg,
      border: `1px solid ${c.border}`, marginLeft: 6, verticalAlign: 'middle', textTransform: 'uppercase',
    }}>{children}</span>
  );
}
