'use client';

import { theme, panelStyle, h3Style, Badge } from './theme';

export default function RightSidebar({ desk, verification, capabilities }) {
  const risk = 'Medium';
  const pending = [
    { id: 'p1', title: 'Scope review required' },
    { id: 'p2', title: 'Approve lab validation' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', overflow: 'auto' }}>
      <section style={panelStyle}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <h3 style={{ ...h3Style, margin: 0 }}>--mev / JeV Gatekeeper</h3>
        </div>
        <div style={{ fontSize: 9, color: theme.muted, marginTop: 4, marginBottom: 8 }}>
          Human oversight for high-impact actions.
        </div>
        <div style={{
          padding: '10px 12px', borderRadius: 8, textAlign: 'center',
          background: theme.warnBg, border: `1px solid rgba(251,191,36,0.55)`,
          color: theme.warn, fontWeight: 800, fontSize: 12, letterSpacing: 1,
          boxShadow: '0 0 16px rgba(251,191,36,0.2)',
        }}>
          NO EXECUTION AUTHORIZED
        </div>
      </section>

      <section style={panelStyle}>
        <h3 style={h3Style}>Pending Approval ({pending.length})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {pending.map((p) => (
            <div key={p.id} style={{
              padding: '6px 8px', borderRadius: 6, fontSize: 10, color: theme.text,
              background: 'rgba(2,14,22,0.7)', border: `1px solid ${theme.panelBorder}`,
            }}>
              {p.title}
            </div>
          ))}
        </div>
      </section>

      <section style={panelStyle}>
        <h3 style={h3Style}>Risk Level</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
          {['Safe', 'Medium', 'Critical'].map((level) => {
            const active = level === risk;
            const color = level === 'Safe' ? theme.green : level === 'Medium' ? theme.warn : theme.danger;
            return (
              <div key={level} style={{
                textAlign: 'center', fontSize: 10, fontWeight: 700, padding: '8px 4px',
                borderRadius: 6,
                border: `1px solid ${active ? color : theme.panelBorder}`,
                background: active ? `${color}22` : 'rgba(2,12,20,0.7)',
                color: active ? color : theme.muted,
                boxShadow: active ? `0 0 12px ${color}44` : 'none',
              }}>{level}</div>
            );
          })}
        </div>
      </section>

      <section style={panelStyle}>
        <h3 style={h3Style}>Two-Reviewer Quorum</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
          {['Reviewer A', 'Reviewer B'].map((r) => (
            <div key={r} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: 10, padding: '6px 8px', borderRadius: 6,
              background: 'rgba(2,14,22,0.7)', border: `1px solid ${theme.panelBorder}`,
            }}>
              <span style={{ color: theme.text }}>{r}</span>
              <Badge tone="warn">Pending</Badge>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <button type="button" disabled style={disabledBtn}>Approve</button>
          <button type="button" disabled style={{ ...disabledBtn, color: theme.danger, borderColor: 'rgba(248,113,113,0.35)' }}>
            Reject
          </button>
        </div>
        <div style={{ marginTop: 6, fontSize: 8, color: theme.concept }}>
          Real approval stays on the TTY / capability gate — buttons are UI-only.
        </div>
      </section>

      <section style={panelStyle}>
        <h3 style={h3Style}>Evidence Receipts</h3>
        <div style={{ fontSize: 10, color: theme.muted, lineHeight: 1.45 }}>
          {verification?.summary || 'No verified evidence yet — Connect workers to begin assessment.'}
        </div>
        {desk?.path && (
          <div style={{ marginTop: 6, fontSize: 8, color: theme.concept, wordBreak: 'break-all' }}>
            desk: {desk.path}
          </div>
        )}
      </section>

      <section style={panelStyle}>
        <h3 style={h3Style}>Hash Receipts</h3>
        <div style={{
          fontSize: 10, color: theme.warn, lineHeight: 1.45,
          padding: '8px', borderRadius: 6,
          border: `1px dashed rgba(251,191,36,0.4)`,
          background: 'rgba(66,32,6,0.25)',
        }}>
          zkVM NOT CONFIGURED — No hash receipts yet.
        </div>
        {capabilities?.models && (
          <div style={{ marginTop: 8, fontSize: 9, color: theme.muted }}>
            Models: {(capabilities.models || []).map((m) => m.name || m.id).filter(Boolean).slice(0, 3).join(' · ') || '—'}
          </div>
        )}
      </section>
    </div>
  );
}

const disabledBtn = {
  fontSize: 10, fontWeight: 700, padding: '8px', borderRadius: 6, cursor: 'not-allowed',
  opacity: 0.55, border: `1px solid ${theme.panelBorder}`,
  background: 'rgba(2,14,22,0.85)', color: theme.greenSoft,
};
