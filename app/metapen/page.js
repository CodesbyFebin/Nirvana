'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import SwarmControlCenter from './components/SwarmControlCenter';
import MuseCliStrip from './components/MuseCliStrip';
import { Badge, theme, CONCEPT_FLEET } from './components/theme';

const NAV = [
  ['command', 'Command'],
  ['swarm', 'Swarm'],
  ['coverage', 'Coverage'],
  ['evidence', 'Evidence'],
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
        <h3 style={{ margin: 0, fontSize: 15, color: theme.cyanSoft }}>{title}</h3>
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
        color: concept ? '#94a3b8' : theme.cyan,
      }}>{value}</div>
      {hint ? <div style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>{hint}</div> : null}
    </div>
  );
}

function StatusChip({ children, tone = 'cyan' }) {
  const color = tone === 'green' ? theme.green : tone === 'warn' ? theme.warn : theme.cyanSoft;
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: 0.5, padding: '5px 10px', borderRadius: 999,
      border: `1px solid ${color}66`, color, background: 'rgba(2,14,22,0.85)',
      whiteSpace: 'nowrap', boxShadow: `0 0 10px ${color}22`,
    }}>{children}</span>
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

  const consoleView = view === 'swarm' || view === 'coverage';

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      background: `radial-gradient(ellipse at 50% 0%, #0a2a38 0%, ${theme.bg} 45%, ${theme.bgDeep} 100%)`,
      color: theme.text, fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* TOP BAR */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        padding: '8px 14px', borderBottom: `1px solid ${theme.panelBorder}`,
        background: 'rgba(2,12,20,0.92)', flexShrink: 0,
        boxShadow: '0 0 24px rgba(34,211,238,0.08)',
      }}>
        <a href="/" style={{
          textDecoration: 'none', fontWeight: 900, fontSize: 16, letterSpacing: 2,
          background: 'linear-gradient(90deg, #67e8f9, #4ade80)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>METAPEN</a>

        <nav style={{ display: 'flex', gap: 4 }}>
          {NAV.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              style={{
                background: view === id ? 'rgba(8,40,56,0.95)' : 'transparent',
                color: view === id ? theme.cyanSoft : theme.muted,
                border: `1px solid ${view === id ? theme.panelBorderStrong : 'transparent'}`,
                borderRadius: 6, padding: '6px 12px', cursor: 'pointer',
                fontWeight: 700, fontSize: 11, letterSpacing: 0.4,
                boxShadow: view === id ? theme.glowCyan : 'none',
              }}
            >{label}</button>
          ))}
        </nav>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginLeft: 'auto', alignItems: 'center' }}>
          <StatusChip>{CONCEPT_FLEET.clans} CLANS / {CONCEPT_FLEET.specialists} SPECIALISTS</StatusChip>
          <StatusChip tone="green">{CONCEPT_FLEET.working} WORKING</StatusChip>
          <StatusChip>{CONCEPT_FLEET.queued} QUEUED</StatusChip>
          <StatusChip>SCOPE: OWNED LAB</StatusChip>
          <button
            type="button"
            onClick={refresh}
            style={{
              fontSize: 9, fontWeight: 800, letterSpacing: 0.6, padding: '6px 12px', borderRadius: 6,
              border: `1px solid ${theme.panelBorderStrong}`, cursor: 'pointer',
              background: 'linear-gradient(180deg, rgba(8,48,64,0.95), rgba(4,24,36,0.95))',
              color: theme.cyanSoft, boxShadow: theme.glowCyan,
            }}
          >
            OPERATOR CONSOLE
          </button>
        </div>
      </header>

      {error ? (
        <div style={{
          background: '#2a1212', borderBottom: '1px solid #7f1d1d', color: '#fecaca',
          padding: '6px 14px', fontSize: 12, flexShrink: 0,
        }}>{error}</div>
      ) : null}

      {/* MAIN */}
      <main style={{
        flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
        overflow: consoleView ? 'hidden' : 'auto', padding: consoleView ? '8px 0 0' : 16,
        maxWidth: consoleView ? 'none' : 1480, width: '100%', margin: consoleView ? 0 : '0 auto',
        boxSizing: 'border-box',
      }}>
        {consoleView ? (
          <SwarmControlCenter swarm={swarm} caps={caps} jobs={jobs} desk={desk} />
        ) : null}

        {view === 'command' ? (
          <>
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
                value={String(CONCEPT_FLEET.specialists)}
                hint="Concept target fleet size"
                concept
              />
            </div>
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
                  <span style={{ fontSize: 12, color: theme.muted }}>Separate from the 10-clan concept roster.</span>
                </div>
              </form>
              {swarmResult ? (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 12, color: theme.cyanSoft }}>
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
            <Card title="Model routing" right={<Badge tone="live">Corrected naming</Badge>}>
              <p style={{ marginTop: 0, color: theme.muted, fontSize: 13 }}>
                Pipeline: {PIPELINE.join(' → ')}. Muse Wonder / Muse Code / Graph Engine (no “Libra”).
              </p>
              <div style={{ display: 'grid', gap: 10 }}>
                {MODELS.map((m) => (
                  <div key={m.name} style={{
                    ...tileStyle, display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12,
                  }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: theme.cyan }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: theme.cyanSoft, marginTop: 2 }}>{m.role}</div>
                    </div>
                    <div style={{ fontSize: 12, color: theme.text }}>{m.detail}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card
              title="JeV (MEV) approval desk"
              right={<Badge tone="live">HITL</Badge>}
            >
              <p style={{ marginTop: 0, color: theme.muted, fontSize: 13 }}>
                {caps?.notice || 'Capability store status loading…'}
                {' '}Decide/consume remain local TTY only (<code>npm run approval</code>).
              </p>
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
                  Task ID
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
        ) : null}

        {view === 'evidence' ? (
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
                  <span style={{ marginLeft: 8, fontSize: 11, color: theme.cyanSoft }}>{item.status}</span>
                  <div style={{ fontSize: 12, color: theme.muted, marginTop: 4, whiteSpace: 'pre-wrap' }}>{item.detail}</div>
                </div>
              ))}
            </Card>
            <Card title="zkVM / Hash Receipts" right={<Badge tone="planned">Planned</Badge>}>
              <p style={{ margin: 0, color: theme.muted, fontSize: 13 }}>
                zkVM NOT CONFIGURED — No hash receipts yet. Planned honesty boundary, not an active prover.
              </p>
            </Card>
          </>
        ) : null}
      </main>

      {/* BOTTOM CLI + FOOTER */}
      <div style={{ flexShrink: 0 }}>
        <MuseCliStrip />
        <footer style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
          padding: '4px 14px 6px', borderTop: `1px solid ${theme.panelBorder}`,
          background: 'rgba(1,6,10,0.95)', fontSize: 9, color: theme.muted,
        }}>
          <span>METAPEN — Security Operations · Scope · Review · Evidence</span>
          <span style={{ color: theme.concept }}>
            UI visualization · Activity shown for presentations · {CONCEPT_FLEET.label} · live advisory swarm = 6 roles
          </span>
        </footer>
      </div>
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
  background: theme.cyanDim,
  color: '#022c22',
  border: 0,
  borderRadius: 8,
  padding: '10px 16px',
  fontWeight: 700,
  cursor: 'pointer',
};

const labelStyle = { display: 'block', fontSize: 12, color: theme.muted };

const preStyle = {
  background: theme.bg,
  border: `1px solid ${theme.panelBorder}`,
  borderRadius: 8,
  padding: 12,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
  fontSize: 12,
  color: theme.greenSoft,
  maxHeight: 220,
  overflow: 'auto',
  marginTop: 8,
};

const th = { padding: '6px 8px', fontWeight: 600 };
const td = { padding: '8px', verticalAlign: 'top' };
