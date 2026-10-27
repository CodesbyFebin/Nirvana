'use client';

import { CLAWS, SWARM_CONCEPT, coverageMatrix } from '../../../lib/claws.mjs';
import { Badge, theme } from './theme';

function heatColor(pct) {
  if (pct >= 10) return '#16a34a';
  if (pct >= 7) return '#15803d';
  if (pct >= 4) return '#14532d';
  return '#1e293b';
}

export default function LeftSidebar({ selectedId, onSelect }) {
  const matrix = coverageMatrix();
  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <section style={panel}>
        <h3 style={h3}>Mission Scope</h3>
        <Badge tone="concept">10 domains</Badge>
        <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
          {CLAWS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              style={{
                textAlign: 'left', background: selectedId === c.id ? '#14532d' : 'transparent',
                border: `1px solid ${selectedId === c.id ? theme.accentDim : '#1f3f2c'}`,
                color: theme.text, borderRadius: 6, padding: '6px 8px', cursor: 'pointer', fontSize: 11,
              }}
            >
              <span style={{ color: theme.accentSoft }}>{c.code}</span> {c.domain}
            </button>
          ))}
        </div>
      </section>

      <section style={panel}>
        <h3 style={h3}>Coverage Matrix</h3>
        <div style={{ fontSize: 10, color: theme.concept, marginBottom: 8 }}>concept heatmap · active/capacity</div>
        <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 4, alignItems: 'center' }}>
          {matrix.map((row) => (
            <div key={row.id} style={{ display: 'contents' }}>
              <span style={{ fontSize: 10, color: theme.muted }}>{row.domain}</span>
              <div style={{
                height: 14, borderRadius: 4, background: heatColor(row.coverage),
                border: '1px solid #1f3f2c', position: 'relative',
              }}>
                <span style={{
                  position: 'absolute', right: 4, top: 0, fontSize: 9, color: '#bbf7d0', lineHeight: '14px',
                }}>{row.coverage}%</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={panel}>
        <h3 style={h3}>Real-Time Swarm Map</h3>
        <Badge tone="concept">concept / target</Badge>
        <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
          {[
            ['Supervisor', SWARM_CONCEPT.supervisors],
            ['Specialist', SWARM_CONCEPT.specialists],
            ['Active', SWARM_CONCEPT.active],
            ['Idle', SWARM_CONCEPT.idle],
          ].map(([label, value]) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              borderBottom: '1px solid #143024', paddingBottom: 4,
            }}>
              <span style={{ fontSize: 11, color: theme.muted }}>{label}</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: theme.accent, fontVariantNumeric: 'tabular-nums' }}>
                {value}
              </span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 10, color: theme.concept, margin: '8px 0 0' }}>{SWARM_CONCEPT.label}</p>
      </section>
    </aside>
  );
}

const panel = {
  background: theme.panel,
  border: `1px solid ${theme.panelBorder}`,
  borderRadius: 12,
  padding: 12,
};

const h3 = { margin: '0 0 6px', fontSize: 13, color: theme.accentSoft };
