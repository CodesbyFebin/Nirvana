'use client';

import { useMemo, useState } from 'react';
import { theme, panelStyle, h3Style, CONCEPT_FLEET } from './theme';
import DotGrid from './DotGrid';

const LAB_DOMAINS = [
  'app.lab.test', 'api.lab.test', 'auth.lab.test', 'admin.lab.test', 'code.lab.test',
  'deps.lab.test', 'config.lab.test', 'cloud.lab.test', 'defense.lab.test', 'evidence.lab.test',
];

export default function LeftSidebar({ claws, matrix }) {
  const [q, setQ] = useState('');
  const registryRows = useMemo(() => {
    const rows = [];
    for (const claw of claws || []) {
      for (const t of claw.tools || []) {
        if (!t.assigned) continue;
        if (q && !t.name.toLowerCase().includes(q.toLowerCase())) continue;
        rows.push({ name: t.name, clan: claw.domain });
        if (rows.length >= 6) return rows;
      }
    }
    return rows;
  }, [claws, q]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', overflow: 'auto' }}>
      <section style={panelStyle}>
        <h3 style={h3Style}>Mission Scope</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {LAB_DOMAINS.map((d) => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: theme.text }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: theme.green,
                boxShadow: '0 0 6px rgba(74,222,128,0.7)', flexShrink: 0,
              }} />
              <span style={{ fontFamily: 'ui-monospace, monospace' }}>{d}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 6, fontSize: 8, color: theme.concept }}>SCOPE: OWNED LAB</div>
      </section>

      <section style={panelStyle}>
        <h3 style={h3Style}>Coverage Matrix</h3>
        <DotGrid matrix={matrix} />
      </section>

      <section style={panelStyle}>
        <h3 style={h3Style}>Recon / Tool Registry</h3>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search 50 tool slots…"
          style={{
            width: '100%', boxSizing: 'border-box', marginBottom: 6,
            fontSize: 10, padding: '6px 8px', borderRadius: 6,
            border: `1px solid ${theme.panelBorder}`, background: 'rgba(2,12,20,0.9)',
            color: theme.text, outline: 'none',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {registryRows.map((r) => (
            <div key={r.name + r.clan} style={{
              display: 'grid', gridTemplateColumns: '1fr 48px 72px', gap: 4,
              fontSize: 9, color: theme.muted, alignItems: 'center',
              padding: '3px 4px', borderRadius: 4, background: 'rgba(2,14,22,0.6)',
            }}>
              <span style={{ color: theme.cyanSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
              <span style={{ color: theme.muted }}>—</span>
              <span style={{ color: theme.warn, textAlign: 'right' }}>Not connected</span>
            </div>
          ))}
          {registryRows.length === 0 && (
            <div style={{ fontSize: 9, color: theme.muted }}>No matching tools</div>
          )}
        </div>
      </section>

      <section style={{ ...panelStyle, flex: 1, minHeight: 120 }}>
        <h3 style={h3Style}>Continuous Swarm Radar</h3>
        <Radar />
        <div style={{ marginTop: 6, fontSize: 9, color: theme.muted, lineHeight: 1.5 }}>
          {CONCEPT_FLEET.clans} clans · {CONCEPT_FLEET.specialists} specialists ·{' '}
          <span style={{ color: theme.green }}>{CONCEPT_FLEET.working} working</span> ·{' '}
          {CONCEPT_FLEET.queued} queued
        </div>
      </section>
    </div>
  );
}

function Radar() {
  return (
    <div style={{ position: 'relative', width: 120, height: 120, margin: '4px auto' }}>
      <style>{`
        @keyframes mp-sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .mp-sweep {
          position: absolute; inset: 0; border-radius: 50%;
          background: conic-gradient(from 0deg, transparent 0deg, rgba(34,211,238,0.35) 40deg, transparent 70deg);
          animation: mp-sweep 4s linear infinite;
          mask: radial-gradient(circle, transparent 28%, black 29%);
          -webkit-mask: radial-gradient(circle, transparent 28%, black 29%);
        }
      `}</style>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        border: `1px solid ${theme.panelBorder}`,
        background: 'radial-gradient(circle, rgba(4,24,36,0.9) 0%, rgba(2,10,16,0.95) 70%)',
        boxShadow: 'inset 0 0 20px rgba(34,211,238,0.12)',
      }} />
      {[30, 50, 70].map((r) => (
        <div key={r} style={{
          position: 'absolute', left: '50%', top: '50%',
          width: r * 2, height: r * 2, marginLeft: -r, marginTop: -r,
          borderRadius: '50%', border: '1px solid rgba(34,211,238,0.18)',
        }} />
      ))}
      <div className="mp-sweep" />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (Math.PI * 2 * i) / 5 + 0.4;
        const r = 28 + (i % 3) * 12;
        return (
          <span key={i} style={{
            position: 'absolute',
            left: `calc(50% + ${Math.cos(a) * r}px)`,
            top: `calc(50% + ${Math.sin(a) * r}px)`,
            width: 5, height: 5, borderRadius: '50%',
            background: i % 2 ? theme.green : theme.cyan,
            boxShadow: `0 0 6px ${i % 2 ? theme.green : theme.cyan}`,
            transform: 'translate(-50%, -50%)',
          }} />
        );
      })}
    </div>
  );
}
