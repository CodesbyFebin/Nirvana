'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

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

function badge(label, tone = 'planned') {
  const colors = {
    planned: { bg: '#1a2e1a', fg: '#86efac', border: '#166534' },
    live: { bg: '#052e1a', fg: '#4ade80', border: '#16a34a' },
    warn: { bg: '#2a2410', fg: '#fbbf24', border: '#854d0e' },
    muted: { bg: '#1a1a1a', fg: '#a3a3a3', border: '#404040' },
  };
  const c = colors[tone] || colors.muted;
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
      padding: '2px 8px', borderRadius: 999, background: c.bg, color: c.fg,
      border: `1px solid ${c.border}`, marginLeft: 6, verticalAlign: 'middle',
    }}>{label}</span>
  );
}

function Card({ title, children, right }) {
  return (
    <section style={{
      background: '#0b140f', border: '1px solid #1a3d28', borderRadius: 12,
      padding: 16, marginBottom: 14,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: 15, color: '#bbf7d0' }}>{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div style={{
      background: '#07110c', border: '1px solid #1f3f2c', borderRadius: 10,
      padding: '14px 16px', minWidth: 140, flex: 1,
    }}>
      <div style={{ fontSize: 11, color: '#86a894', textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#4ade80', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {hint ? <div style={{ fontSize: 11, color: '#7d9585', marginTop: 4 }}>{hint}</div> : null}
    </div>
  );
}

export default function MetaPenPage() {
  const [view, setView] = useState('overview');
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
    } catch (e) { setDesk(null); /* desk optional */ }
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
        credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
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
        credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
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

  return (
    <div style={{ minHeight: '100vh', background: '#050a07', color: '#e8f5ec', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
        padding: '14px 20px', borderBottom: '1px solid #1a3d28', background: '#08140e',
      }}>
        <div>
          <a href="/" style={{ color: '#86efac', textDecoration: 'none', fontSize: 13 }}>← Workspace</a>
          <div style={{ marginTop: 4 }}>
            <strong style={{ fontSize: 20, letterSpacing: 0.4 }}>MetaPen</strong>
            <span style={{ color: '#4ade80', marginLeft: 10, fontSize: 13 }}>AI Cybersecurity OS · concept shell</span>
          </div>
          <div style={{ fontSize: 12, color: '#7d9585', marginTop: 2 }}>
            “500 agents. One mission.” <em style={{ color: '#a3b5a8' }}>(concept / target — not a live agent pool)</em>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PIPELINE.map((stage, i) => (
            <span key={stage} style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 999,
              border: '1px solid #245c3a', color: '#bbf7d0', background: '#0b1a12',
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
              border: `1px solid ${view === id ? '#22c55e' : '#1f3f2c'}`,
              borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
            }}
          >{label}</button>
        ))}
        <button type="button" onClick={refresh} style={{
          marginLeft: 'auto', background: '#0b1a12', color: '#86efac', border: '1px solid #245c3a',
          borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 12,
        }}>Refresh data</button>
      </nav>

      <main style={{ padding: 20, maxWidth: 1180, margin: '0 auto' }}>
        {error ? (
          <div style={{
            background: '#2a1212', border: '1px solid #7f1d1d', color: '#fecaca',
            borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 13,
          }}>{error}</div>
        ) : null}

        {view === 'overview' && (
          <>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <Stat
                label="Configured swarm roles"
                value={swarm ? `${swarm.rolesConfigured}/${swarm.roleCount}` : '—'}
                hint={swarm?.ready ? 'Gateway review ready' : 'Not fully configured'}
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
                label="Desk items"
                value={desk?.items ? desk.items.length : '—'}
                hint={desk ? 'From /api/desk' : 'Desk DB optional'}
              />
            </div>

            <Card title="Control center" right={badge('Live shell', 'live')}>
              <p style={{ margin: '0 0 10px', color: '#a3b5a8', fontSize: 14, lineHeight: 1.5 }}>
                MetaPen folds Jules-Claw’s real APIs into one operator surface: advisory Claw Swarm,
                JeV (MEV) capability approvals, verification evidence, and model routing labels.
                Counts above are live from this host — not fabricated agent fleets.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
                <div style={tileStyle}>
                  <strong>Claw Swarm</strong>
                  <div style={{ fontSize: 12, color: '#9cb5a6', marginTop: 6 }}>
                    {swarm?.roleCount ?? 6} advisory roles · concurrency concept target 30–50 · pool concept “500 agents”
                  </div>
                </div>
                <div style={tileStyle}>
                  <strong>JeV approval desk</strong>
                  <div style={{ fontSize: 12, color: '#9cb5a6', marginTop: 6 }}>
                    Scope: owned-lab · Network: restricted · Decide via local TTY only
                  </div>
                </div>
                <div style={tileStyle}>
                  <strong>Kali sandbox workers</strong>{badge('Planned')}
                  <div style={{ fontSize: 12, color: '#9cb5a6', marginTop: 6 }}>
                    Separate lab workers — not claimed live in this increment.
                  </div>
                </div>
                <div style={tileStyle}>
                  <strong>zkVM verification</strong>{badge('Planned')}
                  <div style={{ fontSize: 12, color: '#9cb5a6', marginTop: 6 }}>
                    No live proof claimed. Receipt verification remains a future layer.
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}

        {view === 'swarm' && (
          <>
            <Card title="Claw Swarm status" right={swarm?.ready ? badge('Configured', 'live') : badge('Not ready', 'warn')}>
              <p style={{ marginTop: 0, color: '#a3b5a8', fontSize: 13 }}>{swarm?.notice || 'Loading…'}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 8 }}>
                {swarm && Object.entries(swarm.roles || {}).map(([role, info]) => (
                  <div key={role} style={{
                    ...tileStyle, borderColor: info.configured ? '#166534' : '#3f3f46',
                  }}>
                    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13 }}>{role}</div>
                    <div style={{ fontSize: 11, color: info.configured ? '#4ade80' : '#a1a1aa', marginTop: 4 }}>
                      {info.configured ? 'model env set' : 'SWARM_MODEL_* missing'}
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: '#7d9585', marginBottom: 0 }}>
                Concept target: pooled concurrency 30–50 of a “500 agents” fleet. Live today: {swarm?.roleCount || 0} advisory roles when gateway is configured.
              </p>
            </Card>
            <Card title="Run advisory review">
              <form onSubmit={runSwarm}>
                <textarea
                  value={swarmPrompt}
                  onChange={(e) => setSwarmPrompt(e.target.value)}
                  maxLength={3000}
                  rows={4}
                  placeholder="Bounded task for six-role gateway review…"
                  style={inputStyle}
                />
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                  <button type="submit" disabled={busy || !swarmPrompt.trim()} style={btnStyle}>
                    {busy ? 'Calling gateway…' : 'Confirm cost & run swarm'}
                  </button>
                  <span style={{ fontSize: 12, color: '#7d9585' }}>Uses real gateway calls when ready; no code execution.</span>
                </div>
              </form>
              {swarmResult ? (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 12, color: '#86efac' }}>
                    actualCalls: {swarmResult.actualCalls}
                    {swarmResult.reportedTokens != null ? ` · tokens: ${swarmResult.reportedTokens}` : ''}
                  </div>
                  <p style={{ fontSize: 12, color: '#a3b5a8' }}>{swarmResult.notice}</p>
                  {(swarmResult.stages || []).map((stage) => (
                    <pre key={stage.role} style={preStyle}>
                      <strong>{stage.role}</strong> · {stage.model} · {stage.latencyMs}ms{'\n'}
                      {stage.text}
                    </pre>
                  ))}
                </div>
              ) : null}
            </Card>
          </>
        )}

        {view === 'jev' && (
          <>
            <Card
              title="JeV (MEV) approval desk"
              right={<>
                {badge('HITL', 'live')}
                <span style={{ fontSize: 11, color: '#86a894', marginLeft: 8 }}>
                  Scope: owned-lab · Network: restricted
                </span>
              </>}
            >
              <p style={{ marginTop: 0, color: '#a3b5a8', fontSize: 13 }}>
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
                  <p style={{ color: '#7d9585', fontSize: 13 }}>No approval rows yet.</p>
                ) : (caps.approvals.map((row) => (
                  <div key={row.id} style={{ ...tileStyle, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                      <code style={{ fontSize: 12 }}>{row.id}</code>
                      <span style={{ fontSize: 11, color: '#4ade80' }}>{row.state}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#a3b5a8', marginTop: 4 }}>
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
            <Card title="Verification jobs" right={badge('Worker profiles: syntax · node-tests', 'live')}>
              {jobs.length === 0 ? (
                <p style={{ color: '#7d9585', fontSize: 13 }}>No jobs from /api/verification (DB may be unset).</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ color: '#86a894', textAlign: 'left' }}>
                        <th style={th}>Status</th>
                        <th style={th}>Profile</th>
                        <th style={th}>Commit</th>
                        <th style={th}>Created</th>
                        <th style={th}>ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.slice(0, 40).map((j) => (
                        <tr key={j.id} style={{ borderTop: '1px solid #1a3d28' }}>
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
            <Card title="Desk / findings journal" right={desk ? badge('Connected', 'live') : badge('Unavailable', 'warn')}>
              {!desk?.items?.length ? (
                <p style={{ color: '#7d9585', fontSize: 13 }}>No desk items (or DATABASE_URL unset). User-authored notes only — not auto-verified findings.</p>
              ) : desk.items.slice(0, 30).map((item) => (
                <div key={item.id || item.title} style={{ ...tileStyle, marginBottom: 8 }}>
                  <strong>{item.title}</strong>
                  <span style={{ marginLeft: 8, fontSize: 11, color: '#86efac' }}>{item.status}</span>
                  <div style={{ fontSize: 12, color: '#a3b5a8', marginTop: 4, whiteSpace: 'pre-wrap' }}>{item.detail}</div>
                </div>
              ))}
            </Card>
            <Card title="zkVM layer" right={badge('Planned')}>
              <p style={{ margin: 0, color: '#a3b5a8', fontSize: 13 }}>
                No live proof claimed. zkVM receipt verification is a planned honesty boundary, not an active prover in this build.
              </p>
            </Card>
            <Card title="Kali sandbox workers" right={badge('Planned')}>
              <p style={{ margin: 0, color: '#a3b5a8', fontSize: 13 }}>
                Lab Kali workers are conceptual for this increment. Live isolation today is the Docker verifier profiles only.
              </p>
            </Card>
          </>
        )}

        {view === 'models' && (
          <Card title="Model routing panel" right={badge('Corrected naming', 'live')}>
            <p style={{ marginTop: 0, color: '#a3b5a8', fontSize: 13 }}>
              Pipeline: {PIPELINE.join(' → ')}. Names below match Meta Muse products where applicable;
              Graph Engine is an internal tier label (not “Libra”).
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              {MODELS.map((m) => (
                <div key={m.name} style={{
                  ...tileStyle, display: 'grid', gridTemplateColumns: '180px 1fr', gap: 12, alignItems: 'start',
                }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#4ade80' }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: '#86efac', marginTop: 4 }}>{m.role}</div>
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
  background: '#07110c',
  border: '1px solid #1f3f2c',
  borderRadius: 10,
  padding: 12,
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#050a07',
  border: '1px solid #245c3a',
  color: '#e8f5ec',
  borderRadius: 8,
  padding: 10,
  fontFamily: 'inherit',
  fontSize: 13,
  marginTop: 4,
};

const btnStyle = {
  background: '#16a34a',
  color: '#052e16',
  border: 0,
  borderRadius: 8,
  padding: '10px 16px',
  fontWeight: 700,
  cursor: 'pointer',
};

const labelStyle = { display: 'block', fontSize: 12, color: '#9cb5a6' };

const preStyle = {
  background: '#050a07',
  border: '1px solid #1f3f2c',
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
