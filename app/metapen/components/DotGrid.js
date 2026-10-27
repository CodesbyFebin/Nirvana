'use client';

import { theme } from './theme';

/** Coverage heatmap grid — "Awaiting assessment" until workers connect. */
export default function DotGrid({ matrix }) {
  const rows = matrix || [];
  return (
    <div>
      <div style={{
        display: 'grid', gridTemplateColumns: '72px repeat(10, 1fr)', gap: 3, alignItems: 'center',
      }}>
        <div />
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ fontSize: 7, color: theme.muted, textAlign: 'center' }}>{i + 1}</div>
        ))}
        {rows.map((row) => (
          <div key={row.id} style={{ display: 'contents' }}>
            <div style={{ fontSize: 8, color: theme.cyanSoft, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.domain}
            </div>
            {Array.from({ length: 10 }).map((_, i) => {
              const filled = i < Math.ceil((row.activeConcept / row.capacity) * 10);
              return (
                <div key={i} style={{
                  height: 10, borderRadius: 2,
                  background: filled
                    ? `linear-gradient(180deg, ${theme.cyan}, ${theme.greenDim})`
                    : 'rgba(15,30,42,0.9)',
                  border: `1px solid ${filled ? 'rgba(34,211,238,0.4)' : 'rgba(34,211,238,0.12)'}`,
                  boxShadow: filled ? '0 0 6px rgba(34,211,238,0.25)' : 'none',
                }} />
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 6, fontSize: 9, color: theme.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: theme.cyan, boxShadow: theme.glowCyan }} />
        Awaiting assessment
      </div>
    </div>
  );
}
