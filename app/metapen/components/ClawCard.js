'use client';

import { useMemo, useState } from 'react';
import DotGrid from './DotGrid';
import { Badge, theme } from './theme';

export default function ClawCard({ claw, expanded, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(claw.id)}
      style={{
        textAlign: 'left', cursor: 'pointer', width: '100%',
        background: expanded ? '#0c1f14' : theme.tile,
        border: `1px solid ${expanded ? theme.accentDim : theme.panelBorder}`,
        borderRadius: 10, padding: 10, color: theme.text,
        boxShadow: expanded ? `0 0 16px #16a34a33` : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
        <strong style={{ fontSize: 11, letterSpacing: 0.4, color: theme.accentSoft }}>
          {claw.code} {claw.domain}
        </strong>
        <span style={{ fontSize: 10, color: theme.concept }}>
          <span style={{ color: theme.accent, fontWeight: 700 }}>{claw.activeConcept}</span>
          <span style={{ opacity: 0.7 }}> ACTIVE / {claw.capacity}</span>
          <Badge tone="concept">concept</Badge>
        </span>
      </div>
      <div style={{ marginTop: 8 }}>
        <DotGrid claw={claw} cols={10} />
      </div>
      <div style={{ fontSize: 9, color: theme.muted, marginTop: 6 }}>
        {claw.tools.filter((t) => t.assigned).length} named tools · click to expand
      </div>
    </button>
  );
}

export function ClawExpandPanel({ claw, onClose }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return claw.tools;
    return claw.tools.filter((t) => t.name.toLowerCase().includes(needle) || t.mastery.toLowerCase().includes(needle));
  }, [claw, q]);

  return (
    <div style={{
      marginTop: 12, background: '#06140c', border: `1px solid ${theme.accentDim}`,
      borderRadius: 12, padding: 14,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div>
          <strong style={{ color: theme.accent }}>{claw.code} — {claw.domain}</strong>
          <Badge tone="concept">concept roster</Badge>
        </div>
        <button type="button" onClick={onClose} style={{
          background: 'transparent', border: `1px solid ${theme.panelBorder}`, color: theme.muted,
          borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
        }}>Close</button>
      </div>
      <div style={{ margin: '12px 0' }}>
        <DotGrid claw={claw} cols={10} large />
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search tools / mastery notes…"
        style={{
          width: '100%', boxSizing: 'border-box', background: '#050a07',
          border: `1px solid ${theme.panelBorder}`, color: theme.text,
          borderRadius: 8, padding: 8, fontSize: 12, marginBottom: 10,
        }}
      />
      <div style={{ maxHeight: 260, overflow: 'auto', display: 'grid', gap: 6 }}>
        {filtered.map((tool) => (
          <div key={tool.id} style={{
            display: 'grid', gridTemplateColumns: '28px 1fr', gap: 8,
            padding: '6px 8px', borderRadius: 6,
            background: tool.assigned ? '#0a1a10' : '#0a0a0a',
            border: `1px solid ${tool.assigned ? '#1f3f2c' : '#222'}`,
            opacity: tool.assigned ? 1 : 0.55,
          }}>
            <span style={{ fontSize: 10, color: theme.muted, fontVariantNumeric: 'tabular-nums' }}>{tool.slot}</span>
            <div>
              <div style={{ fontSize: 12, fontFamily: 'ui-monospace, monospace', color: tool.assigned ? theme.accentSoft : theme.muted }}>
                {tool.name}
                {!tool.assigned ? <Badge tone="muted">unassigned</Badge> : null}
              </div>
              <div style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>{tool.mastery}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
