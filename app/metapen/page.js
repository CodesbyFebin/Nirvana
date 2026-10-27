'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import SwarmControlCenter from './components/SwarmControlCenter';
import { Badge, theme } from './components/theme';

const VIEWS = [
  ['overview', 'Overview'],
  ['swarm', 'Claw Swarm'],
  ['jev', 'JeV Desk'],
  ['evidence', 'Evidence'],
  ['models', 'Models'],
];

const PIPELINE = ['Perception', 'Reasoning', 'Report', 'Action'];

const MODELS = [
  {
    name: 'Muse Code',
    role: 'Light + task planning',
    detail: 'Terminal coding agent harness — lightweight execution and planning slots.',
  },
  {
    name: 'Muse Wonder',
    role: 'Reasoning + multi-agent',
    detail: 'Frontier agentic reasoning with long context for swarm synthesis and desk correlation.',
  },
  {
    name: 'Graph Engine',
    role: 'Graph + analysis tier',
    detail: 'Internal graph/analysis component (not a Meta product name). Routes heavy correlation work; no “Libra” model claimed.',
  },
];

function Card({ title, children, right }) {
  return (
    <section style={{
      background: theme.panel, border: `1px solid ${theme.panelBorder}`, borderRadius: 12,
      padding: 16, marginBottom: 14,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: 15, color: theme.accentSoft }}>{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value, hint, concept }) {
  return (
    <div style={{
      background: theme.tile, border: `1px solid ${theme.panelBorder}`, borderRadius: 10,
      padding: '14px 16px', minWidth: 140, flex: 1,
    }}>
      <div style={{ fontSize: 11, color: theme.muted, textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {label}{concept ? <Badge tone="concept">concept</Badge> : null}
      </div>
      <div style={{
        fontSize: 28, fontWeight: 700, marginTop: 4, fontVariantNumeric: 'tabular-nums',
        color: concept ? '#94a3b8' : theme.accent,
      }}>{value}</div>
      {hint ? <div style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>{hint}</div> : null}
    </div>
  );
}

export default function MetaPenPage() {
  const [view, setView] = useState('swarm');
  const [error, setError] = useState('');
  const [swarm, setSwarm] = useState(null);
  const [caps, setCaps] = useState(null);
  const [desk, setDesk] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [swarmPrompt, setSwarmPrompt] = useState('');
  const [swarmResult, setSwarmResult] = useState(null);
  const [capForm, setCapForm] = useState({
    capability: 'verify.syntax',
    taskId: '',
    sourceSha256: '',
  });
  const [lastRequest, setLastRequest] = useState(null);

  const refresh = useCallback(async () => {
    setError('');
    const problems = [];
    try {
      const r = await fetch('/api/swarm', { cache: 'no-store', credentials: 'same-origin' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Swarm status unavailable');
      setSwarm(d);
    } catch (e) { problems.push(e.message); setSwarm(null); }
    try {
      const r = await fetch('/api/capabilities', { cache: 'no-store', credentials: 'same-origin' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Approvals unavailable');
      setCaps(d);
    } catch (e) { problems.push(e.message); setCaps(null); }
    try {
      const r = await fetch('/api/desk', { cache: 'no-store', credentials: 'same-origin' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Desk unavailable');
      setDesk(d);
    } catch { setDesk(null); }
    try {
      const r = await fetch('/api/verification', { cache: 'no-store', credentials: 'same-origin' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Verification unavailable');
      setJobs(d.jobs || []);
    } catch (e) { setJobs([]); problems.push(e.message); }
    if (problems.length) setError(problems.join(' · '));
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(() => refresh(), 20000);
    return () => clearInterval(t);
  }, [refresh]);

  const approvalCounts = useMemo(() => {
    const rows = caps?.approvals || [];
    return rows.reduce((acc, row) => {
      acc[row.state] = (acc[row.state] || 0) + 1;
      acc.total += 1;
      return acc;
    }, { total: 0, pending: 0, approved: 0, rejected: 0, consumed: 0 });
  }, [caps]);

  const jobCounts = useMemo(() => jobs.reduce((acc, j) => {
    acc[j.status] = (acc[j.status] || 0) + 1;
    acc.total += 1;
    return acc;
  }, { total: 0 }), [jobs]);

  async function runSwarm(e) {
    e.preventDefault();
    setBusy(true);
    setSwarmResult(null);
    setError('');
    try {
      const r = await fetch('/api/swarm', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: swarmPrompt, confirmCost: true }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Swarm review failed');
      setSwarmResult(d);
      await refresh();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function requestCap(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setLastRequest(null);
    try {
      const r = await fetch('/api/capabilities', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capability: capForm.capability,
          taskId: capForm.taskId.trim(),
          sourceSha256: capForm.sourceSha256.trim().toLowerCase(),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Request failed');
      setLastRequest(d.approval);
      setCapForm((f) => ({ ...f, taskId: '', sourceSha256: '' }));
      await refresh();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  const showOrbit = view === 'overview' || view === 'swarm';

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, color: theme.text, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
        padding: '14px 20px', borderBottom: `1px solid ${theme.panelBorder}`, background: theme.panel,
      }}>
        <div>
          <a href="/" style={{ color: theme.accentSoft, textDecoration: 'none', fontSize: 13 }}>← Workspace</a>
          <div style={{ marginTop: 4 }}>
            <strong style={{ fontSize: 20, letterSpacing: 0.4 }}>MetaPen</strong>
            <span style={{ color: theme.accent, marginLeft: 10, fontSize: 13 }}>AI Cybersecurity OS · control center</span>
          </div>
          <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>
            “500 agents. One mission.” <em style={{ color: theme.concept }}>(concept / target — not a live agent pool)</em>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PIPELINE.map((stage, i) => (
            <span key={stage} style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 999,
              border: `1px solid ${theme.panelBorder}`, color: theme.accentSoft, background: theme.tile,
            }}>
              {i + 1}. {stage}
            </span>
          ))}
        </div>
      </header>

      <nav style={{
        display: 'flex', gap: 6, padding: '10px 20px', borderBottom: '1px solid #143024',
        background: '#070f0b', flexWrap: 'wrap',
      }}>
        {VIEWS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            style={{
              background: view === id ? '#14532d' : 'transparent',
              color: view === id ? '#ecfdf5' : '#9cb5a6',
              border: `1px solid ${view === id ? theme.accent : theme.panelBorder}`,
              borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
            }}
          >{label}</button>
        ))}
        <button type="button" onClick={refresh} style={{
          marginLeft: 'auto', background: theme.tile, color: theme.accentSoft, border: `1px solid ${theme.panelBorder}`,
          borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 12,
        }}>Refresh data</button>
      </nav>

      <main style={{ padding: 16, maxWidth: 1480, margin: '0 auto' }}>
        {error ? (
          <div style={{
            background: '#2a1212', border: '1px solid #7f1d1d', color: '#fecaca',
            borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 13,
          }}>{error}</div>
        ) : null}

        {showOrbit ? (
          <>
            {view === 'overview' ? (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                <Stat
                  label="Gateway swarm roles"
                  value={swarm ? `${swarm.rolesConfigured}/${swarm.roleCount}` : '—'}
                  hint={swarm?.ready ? 'Live /api/swarm ready' : 'Not fully configured'}
                />
                <Stat
                  label="Approval records"
                  value={caps ? approvalCounts.total : '—'}
                  hint={caps ? `${approvalCounts.pending || 0} pending` : 'Store unreachable'}
                />
                <Stat
                  label="Verification jobs"
                  value={jobCounts.total}
                  hint={Object.entries(jobCounts).filter(([k]) => k !== 'total').map(([k, v]) => `${k}:${v}`).join(' · ') || 'none queued'}
                />
                <Stat
                  label="Specialist pool"
                  value="500"
                  hint="Concept target fleet size"
                  concept
                />
              </div>
            ) : null}
            <SwarmControlCenter swarm={swarm} caps={caps} jobs={jobs} onRefresh={refresh} />
            {view === 'swarm' ? (
              <Card title="Run advisory gateway review (live 6-role API)" right={<Badge tone="live">/api/swarm</Badge>}>
                <form onSubmit={runSwarm}>
                  <textarea
                    value={swarmPrompt}
                    onChange={(e) => setSwarmPrompt(e.target.value)}
                    maxLength={3000}
                    rows={3}
                    placeholder="Bounded task for six-role gateway review…"
                    style={inputStyle}
                  />
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                    <button type="submit" disabled={busy || !swarmPrompt.trim()} style={btnStyle}>
                      {busy ? 'Calling gateway…' : 'Confirm cost & run swarm'}
                    </button>
                    <span style={{ fontSize: 12, color: theme.muted }}>Separate from the 10-claw concept roster above.</span>
                  </div>
                </form>
                {swarmResult ? (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 12, color: theme.accentSoft }}>
                      actualCalls: {swarmResult.actualCalls}
                      {swarmResult.reportedTokens != null ? ` · tokens: ${swarmResult.reportedTokens}` : ''}
                    </div>
                    <p style={{ fontSize: 12, color: theme.muted }}>{swarmResult.notice}</p>
                    {(swarmResult.stages || []).map((stage) => (
                      <pre key={stage.role} style={preStyle}>
                        <strong>{stage.role}</strong> · {stage.model} · {stage.latencyMs}ms{'\n'}
                        {stage.text}
                      </pre>
                    ))}
                  </div>
                ) : null}
              </Card>
            ) : null}
          </>
        ) : null}

        {view === 'jev' && (
          <>
            <Card
              title="JeV (MEV) approval desk"
              right={<>
                <Badge tone="live">HITL</Badge>
                <span style={{ fontSize: 11, color: theme.muted, marginLeft: 8 }}>
                  Scope: owned-lab · Network: restricted
                </span>
              </>}
            >
              <p style={{ marginTop: 0, color: theme.muted, fontSize: 13 }}>
                {caps?.notice || 'Capability store status loading…'}
                {' '}Decide/consume remain local TTY only (<code>npm run approval</code> / <code>execute:approved</code>).
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                <Stat label="Pending" value={approvalCounts.pending || 0} />
                <Stat label="Approved" value={approvalCounts.approved || 0} />
                <Stat label="Consumed" value={approvalCounts.consumed || 0} />
                <Stat label="Rejected" value={approvalCounts.rejected || 0} />
              </div>
              <div style={{ fontSize: 12, color: '#9cb5a6', marginBottom: 8 }}>
                Allowlisted: {(caps?.allowlisted || []).join(', ') || '—'}
              </div>
              <div style={{ maxHeight: 280, overflow: 'auto' }}>
                {(caps?.approvals || []).length === 0 ? (
                  <p style={{ color: theme.muted, fontSize: 13 }}>No approval rows yet.</p>
                ) : (caps.approvals.map((row) => (
                  <div key={row.id} style={{ ...tileStyle, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                      <code style={{ fontSize: 12 }}>{row.id}</code>
                      <span style={{ fontSize: 11, color: theme.accent }}>{row.state}</span>
                    </div>
                    <div style={{ fontSize: 12, color: theme.muted, marginTop: 4 }}>
                      {row.action?.capability} · task {row.action?.taskId}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b8575' }}>expires {row.expiresAt}</div>
                  </div>
                )))}
              </div>
            </Card>
            <Card title="Request capability approval">
              <form onSubmit={requestCap} style={{ display: 'grid', gap: 10, maxWidth: 560 }}>
                <label style={labelStyle}>
                  Capability
                  <select
                    value={capForm.capability}
                    onChange={(e) => setCapForm((f) => ({ ...f, capability: e.target.value }))}
                    style={inputStyle}
                  >
                    {(caps?.allowlisted || ['verify.syntax', 'verify.node-tests']).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label style={labelStyle}>
                  Task ID (8–96 [A-Za-z0-9_-])
                  <input
                    value={capForm.taskId}
                    onChange={(e) => setCapForm((f) => ({ ...f, taskId: e.target.value }))}
                    style={inputStyle}
                    placeholder="lab-task-00123456"
                    required
                  />
                </label>
                <label style={labelStyle}>
                  Source SHA-256
                  <input
                    value={capForm.sourceSha256}
                    onChange={(e) => setCapForm((f) => ({ ...f, sourceSha256: e.target.value }))}
                    style={inputStyle}
                    placeholder="64 hex chars"
                    required
                    pattern="[a-fA-F0-9]{64}"
                  />
                </label>
                <button type="submit" disabled={busy} style={btnStyle}>Request approval</button>
              </form>
              {lastRequest ? (
                <pre style={{ ...preStyle, marginTop: 12 }}>
                  Requested {lastRequest.id} · state {lastRequest.state} · expires {lastRequest.expiresAt}
                </pre>
              ) : null}
            </Card>
          </>
        )}

        {view === 'evidence' && (
          <>
            <Card title="Verification jobs" right={<Badge tone="live">syntax · node-tests</Badge>}>
              {jobs.length === 0 ? (
                <p style={{ color: theme.muted, fontSize: 13 }}>No jobs from /api/verification (DB may be unset).</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ color: theme.muted, textAlign: 'left' }}>
                        <th style={th}>Status</th>
                        <th style={th}>Profile</th>
                        <th style={th}>Commit</th>
                        <th style={th}>Created</th>
                        <th style={th}>ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.slice(0, 40).map((j) => (
                        <tr key={j.id} style={{ borderTop: `1px solid ${theme.panelBorder}` }}>
                          <td style={td}>{j.status}</td>
                          <td style={td}>{j.profile}</td>
                          <td style={td}><code>{(j.commit_sha || '').slice(0, 12)}</code></td>
                          <td style={td}>{j.created_at ? new Date(j.created_at).toLocaleString() : '—'}</td>
                          <td style={td}><code style={{ fontSize: 11 }}>{j.id}</code></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
            <Card title="Desk / findings journal" right={desk ? <Badge tone="live">Connected</Badge> : <Badge tone="warn">Unavailable</Badge>}>
              {!desk?.items?.length ? (
                <p style={{ color: theme.muted, fontSize: 13 }}>No desk items (or DATABASE_URL unset). User-authored notes only.</p>
              ) : desk.items.slice(0, 30).map((item) => (
                <div key={item.id || item.title} style={{ ...tileStyle, marginBottom: 8 }}>
                  <strong>{item.title}</strong>
                  <span style={{ marginLeft: 8, fontSize: 11, color: theme.accentSoft }}>{item.status}</span>
                  <div style={{ fontSize: 12, color: theme.muted, marginTop: 4, whiteSpace: 'pre-wrap' }}>{item.detail}</div>
                </div>
              ))}
            </Card>
            <Card title="zkVM / Hash Receipts" right={<Badge tone="planned">Planned</Badge>}>
              <p style={{ margin: 0, color: theme.muted, fontSize: 13 }}>
                No live proof claimed. zkVM receipt verification is a planned honesty boundary, not an active prover in this build.
              </p>
            </Card>
            <Card title="Kali sandbox workers" right={<Badge tone="planned">Planned</Badge>}>
              <p style={{ margin: 0, color: theme.muted, fontSize: 13 }}>
                Lab Kali workers remain conceptual for this increment. Live isolation today is Docker verifier profiles only.
              </p>
            </Card>
          </>
        )}

        {view === 'models' && (
          <Card title="Model routing panel" right={<Badge tone="live">Corrected naming</Badge>}>
            <p style={{ marginTop: 0, color: theme.muted, fontSize: 13 }}>
              Pipeline: {PIPELINE.join(' → ')}. Muse names match Meta products where applicable;
              Graph Engine is an internal tier label (not “Libra”).
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              {MODELS.map((m) => (
                <div key={m.name} style={{
                  ...tileStyle, display: 'grid', gridTemplateColumns: '180px 1fr', gap: 12, alignItems: 'start',
                }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: theme.accent }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: theme.accentSoft, marginTop: 4 }}>{m.role}</div>
                  </div>
                  <div style={{ fontSize: 13, color: '#c5d9cc' }}>{m.detail}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

const tileStyle = {
  background: theme.tile,
  border: `1px solid ${theme.panelBorder}`,
  borderRadius: 10,
  padding: 12,
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  background: theme.bg,
  border: `1px solid ${theme.panelBorder}`,
  color: theme.text,
  borderRadius: 8,
  padding: 10,
  fontFamily: 'inherit',
  fontSize: 13,
  marginTop: 4,
};

const btnStyle = {
  background: theme.accentDim,
  color: '#052e16',
  border: 0,
  borderRadius: 8,
  padding: '10px 16px',
  fontWeight: 700,
  cursor: 'pointer',
};

const labelStyle = { display: 'block', fontSize: 12, color: '#9cb5a6' };

const preStyle = {
  background: theme.bg,
  border: `1px solid ${theme.panelBorder}`,
  borderRadius: 8,
  padding: 12,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
  fontSize: 12,
  color: '#d1fae5',
  maxHeight: 220,
  overflow: 'auto',
  marginTop: 8,
};

const th = { padding: '6px 8px', fontWeight: 600 };
const td = { padding: '8px', verticalAlign: 'top' };
