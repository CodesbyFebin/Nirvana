'use client';

import { useState } from 'react';
import { Badge, theme } from './theme';

export default function RightSidebar({ caps, onRefresh }) {
  const [risk, setRisk] = useState('Safe');
  const [quorum, setQuorum] = useState({ a: false, b: false });
  const approvals = caps?.approvals || [];
  const pending = approvals.filter((a) => a.state === 'pending');
  const pendingCount = pending.length;

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <section style={panel}>
        <div style={{ fontSize: 11, color: theme.warn, fontWeight: 700, letterSpacing: 0.5 }}>
          --mev / JeV Gatekeeper
        </div>
        <div style={{
          marginTop: 6, padding: '8px 10px', borderRadius: 8,
          background: pendingCount ? '#2a1a0a' : '#0a1a10',
          border: `1px solid ${pendingCount ? '#854d0e' : theme.panelBorder}`,
          fontSize: 12, fontWeight: 700, color: pendingCount ? theme.warn : theme.accent,
        }}>
          {pendingCount ? 'AWAITING HUMAN REVIEW' : 'NO PENDING REVIEWS'}
          <div style={{ fontSize: 11, fontWeight: 500, color: theme.muted, marginTop: 4 }}>
            {pendingCount} pending · from /api/capabilities
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: theme.muted, marginBottom: 6 }}>Risk posture</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['Safe', 'Medium', 'Critical'].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setRisk(level)}
                style={{
                  flex: 1, padding: '6px 4px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                  border: `1px solid ${risk === level ? theme.accent : theme.panelBorder}`,
                  background: risk === level
                    ? (level === 'Critical' ? '#450a0a' : level === 'Medium' ? '#422006' : '#052e16')
                    : 'transparent',
                  color: risk === level
                    ? (level === 'Critical' ? '#fca5a5' : level === 'Medium' ? theme.warn : theme.accent)
                    : theme.muted,
                }}
              >{level}</button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: theme.muted, marginBottom: 6 }}>
            Two-reviewer quorum <Badge tone="concept">UI only</Badge>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['a', 'Reviewer A'], ['b', 'Reviewer B']].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setQuorum((q) => ({ ...q, [key]: !q[key] }))}
                style={{
                  flex: 1, padding: 8, borderRadius: 8, cursor: 'pointer', fontSize: 11,
                  border: `1px solid ${quorum[key] ? theme.accentDim : theme.panelBorder}`,
                  background: quorum[key] ? '#052e16' : theme.tile, color: theme.text,
                }}
              >
                {label}: {quorum[key] ? '✓' : '○'}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 10, color: theme.concept, marginTop: 6 }}>
            Quorum indicator is local UI state. Real decide/consume remains TTY (`npm run approval`).
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            type="button"
            disabled={!quorum.a || !quorum.b || !pendingCount}
            title="Remote approve is intentionally unavailable — use local TTY"
            style={{
              flex: 1, padding: 8, borderRadius: 8, fontWeight: 700, fontSize: 12,
              background: quorum.a && quorum.b && pendingCount ? '#16a34a' : '#1f2937',
              color: quorum.a && quorum.b && pendingCount ? '#052e16' : '#6b7280',
              border: 0, cursor: 'not-allowed', opacity: 0.85,
            }}
          >Approve</button>
          <button
            type="button"
            disabled={!pendingCount}
            title="Remote reject is intentionally unavailable — use local TTY"
            style={{
              flex: 1, padding: 8, borderRadius: 8, fontWeight: 700, fontSize: 12,
              background: '#1f2937', color: '#9ca3af', border: `1px solid #374151`,
              cursor: 'not-allowed', opacity: 0.85,
            }}
          >Reject</button>
        </div>
        <button type="button" onClick={onRefresh} style={{
          marginTop: 8, width: '100%', padding: 6, borderRadius: 6, cursor: 'pointer',
          background: 'transparent', border: `1px solid ${theme.panelBorder}`, color: theme.accentSoft, fontSize: 11,
        }}>Refresh approvals</button>
      </section>

      <section style={panel}>
        <h3 style={h3}>Pending queue</h3>
        {pending.length === 0 ? (
          <p style={{ fontSize: 11, color: theme.muted, margin: 0 }}>No pending rows in approval store.</p>
        ) : pending.slice(0, 8).map((row) => (
          <div key={row.id} style={{
            marginBottom: 8, padding: 8, borderRadius: 8, background: theme.tile,
            border: `1px solid ${theme.panelBorder}`, fontSize: 11,
          }}>
            <code style={{ fontSize: 10 }}>{row.id.slice(0, 8)}…</code>
            <div style={{ color: theme.accentSoft }}>{row.action?.capability}</div>
            <div style={{ color: theme.muted }}>expires {row.expiresAt}</div>
          </div>
        ))}
      </section>

      <section style={panel}>
        <h3 style={h3}>Evidence Receipts</h3>
        <p style={{ fontSize: 11, color: theme.muted, margin: '0 0 8px' }}>
          Live verification jobs / desk notes appear under Evidence tab. Gatekeeper shows approval digests only.
        </p>
        <div style={{
          padding: 10, borderRadius: 8, background: '#0a0f0c',
          border: '1px dashed #334155', fontSize: 11, color: theme.concept,
        }}>
          Hash Receipts · zkVM <Badge tone="planned">Planned</Badge>
          <div style={{ marginTop: 6 }}>No live proof claimed — receipt verification is a future honesty layer.</div>
        </div>
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
