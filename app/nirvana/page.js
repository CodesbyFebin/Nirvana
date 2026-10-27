'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { theme, Badge } from './components/theme';

const TRACKS = [
  {
    id: 'coding',
    icon: '⌘',
    name: 'Muse-Claw DevOps',
    track: 'Coding & Agentic Engineering',
    blurb: 'Write, test, and review code in an isolated runtime.',
    status: 'RUNTIME NOT CONNECTED',
    detail: 'Requires coding endpoint, Kata worker, and test runner. Task intake is live; execution is blocked.',
  },
  {
    id: 'agents',
    icon: '✳',
    name: 'Dragon Router + JeV',
    track: 'Best Apps & Agents',
    blurb: 'Route by declared action scope. High-impact work needs human approval.',
    status: 'LOCAL POLICY ACTIVE',
    detail: 'Deterministic scope policy is live. Model-based classification and external tools are not connected.',
    href: '/metapen',
    hrefLabel: 'Open MetaPen swarm console →',
  },
  {
    id: 'memory',
    icon: '◈',
    name: 'Sentinel-Memory Vault',
    track: 'Personal AI',
    blurb: 'Retrieve only memory explicitly granted to the active task.',
    status: 'NOT CONNECTED',
    detail: 'Requires encrypted database, identity, and server-side TBAC. Registry is read-only.',
  },
  {
    id: 'physical',
    icon: '⌁',
    name: 'Edge-Sentinel Bridge',
    track: 'Physical AI',
    blurb: 'Validate safety constraints before edge deployment.',
    status: 'SCALAR CHECK ONLY',
    detail: 'Local torque arithmetic available. Simulation and hardware remain unconnected.',
  },
];

const VIEWS = [
  ['overview', 'Overview'],
  ['tasks', 'Tasks'],
  ['approvals', 'JeV Desk'],
  ['physical', 'Physical'],
  ['evidence', 'Evidence'],
  ['connections', 'Connections'],
];

function Card({ title, right, children }) {
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

function Metric({ label, value, hint }) {
  return (
    <div style={{
      background: theme.tile, border: `1px solid ${theme.panelBorder}`, borderRadius: 10,
      padding: '14px 16px', flex: 1, minWidth: 140,
    }}>
      <div style={{ fontSize: 11, color: theme.muted, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, fontVariantNumeric: 'tabular-nums', color: theme.text }}>{value}</div>
      <div style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>{hint}</div>
    </div>
  );
}

function toast(setToast, msg) {
  setToast(msg);
  setTimeout(() => setToast(''), 3500);
}

async function api(path, opts) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.code = data.code;
    throw err;
  }
  return data;
}

export default function NirvanaPage() {
  const [view, setView] = useState('overview');
  const [tasks, setTasks] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [events, setEvents] = useState([]);
  const [chain, setChain] = useState(null);
  const [connections, setConnections] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toastMsg, setToast] = useState('');
  const [form, setForm] = useState({ name: '', description: '', module: 'Muse-Claw DevOps', scope: 'write' });
  const [torque, setTorque] = useState({ torque: '12', limit: '10', result: null });
  const [filter, setFilter] = useState('all');

  const refresh = useCallback(async () => {
    setError('');
    try {
      const [t, a, e, s] = await Promise.all([
        api('/api/nirvana/tasks'),
        api('/api/nirvana/approvals'),
        api('/api/nirvana/events?limit=100'),
        api('/api/nirvana/status'),
      ]);
      setTasks(t.tasks || []);
      setApprovals(a.approvals || []);
      setEvents(e.events || []);
      setChain(e.chainVerification || null);
      setStatus(s);
      setConnections(s.connections || []);
    } catch (err) {
      setError(err.message || 'Failed to load Nirvana state');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function createTask(ev) {
    ev.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await api('/api/nirvana/tasks', { method: 'POST', body: JSON.stringify(form) });
      setForm({ name: '', description: '', module: 'Muse-Claw DevOps', scope: 'write' });
      toast(setToast, form.scope === 'read'
        ? 'Task recorded. Execution requires a connected runtime.'
        : 'Task recorded. Human approval required — external execution blocked.');
      setView('tasks');
      await refresh();
    } catch (err) {
      setError(err.message);
      toast(setToast, `Create failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function decide(approval, decision) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await api('/api/nirvana/approvals', {
        method: 'POST',
        body: JSON.stringify({
          approvalId: approval.id,
          decision,
          expectedActionDigest: approval.actionDigest,
        }),
      });
      toast(setToast, decision === 'approved'
        ? 'Scope approved. Runtime remains unconnected. NO EXECUTION AUTHORIZED.'
        : 'Task rejected.');
      if (result.execution && !result.execution.authorized) {
        /* keep banner honest */
      }
      await refresh();
    } catch (err) {
      setError(err.message);
      toast(setToast, `Decision failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function runTorque(ev) {
    ev.preventDefault();
    if (busy) return;
    setBusy(true);
    setTorque((t) => ({ ...t, result: { loading: true } }));
    try {
      const result = await api('/api/nirvana/physical/torque', {
        method: 'POST',
        body: JSON.stringify({ torque: Number(torque.torque), limit: Number(torque.limit) }),
      });
      setTorque((t) => ({ ...t, result }));
      toast(setToast, `${result.label} · hardware remains disabled`);
      await refresh();
    } catch (err) {
      setTorque((t) => ({ ...t, result: { error: err.message } }));
      toast(setToast, `Torque check failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function verifyChain() {
    setBusy(true);
    try {
      const e = await api('/api/nirvana/events?limit=1000');
      setChain(e.chainVerification);
      setEvents(e.events || []);
      toast(setToast, e.chainVerification?.ok
        ? `PASS · ${e.chainVerification.count} events. No independent attestation.`
        : `FAIL · ${e.chainVerification?.reason || 'chain broken'}`);
    } catch (err) {
      toast(setToast, err.message);
    } finally {
      setBusy(false);
    }
  }

  function exportEvidence() {
    // Trigger download via authenticated fetch
    window.open('/api/nirvana/evidence/export', '_blank');
  }

  const pending = approvals.length;
  const filtered = tasks.filter((t) => filter === 'all' || t.status === filter);

  const shell = {
    minHeight: '100vh', background: `radial-gradient(1200px 600px at 50% -10%, #0a3a4a 0%, ${theme.bg} 55%)`,
    color: theme.text, fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif',
  };

  return (
    <div style={shell}>
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        padding: '14px 22px', borderBottom: `1px solid ${theme.panelBorder}`,
        background: 'rgba(1,7,13,0.85)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.4 }}>
              <span style={{ color: theme.cyan }}>✳</span> Nirvana
            </div>
            <div style={{ fontSize: 10, color: theme.muted, letterSpacing: 1.2 }}>SOVEREIGN VERIFIABLE AI CLOUD</div>
          </div>
          <Badge tone="planned">local vertical slice</Badge>
        </div>
        <div style={{ fontSize: 11, color: theme.muted, maxWidth: 420, textAlign: 'right' }}>
          Build with NVIDIA. Verify with RISC Zero. Own on Nebius.
          <div style={{ color: theme.warn, marginTop: 2 }}>Positioning only — cloud runtimes Unconnected</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 999,
            border: `1px solid ${theme.panelBorder}`, color: theme.cyanSoft,
          }}>◈ OPERATOR MODE</span>
          <Link href="/metapen" style={{ color: theme.greenSoft, fontSize: 12 }}>MetaPen swarm →</Link>
          <Link href="/" style={{ color: theme.muted, fontSize: 12 }}>Home</Link>
        </div>
      </header>

      <div style={{ display: 'flex', gap: 0, minHeight: 'calc(100vh - 64px)' }}>
        <aside style={{
          width: 200, flexShrink: 0, padding: '18px 12px',
          borderRight: `1px solid ${theme.panelBorder}`, background: theme.bgDeep,
        }}>
          <div style={{ fontSize: 10, color: theme.muted, letterSpacing: 1.2, marginBottom: 10 }}>WORKSPACE</div>
          {VIEWS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', marginBottom: 4,
                padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                border: view === id ? `1px solid ${theme.panelBorderStrong}` : '1px solid transparent',
                background: view === id ? theme.panel : 'transparent',
                color: view === id ? theme.cyanSoft : theme.muted, fontSize: 13,
              }}
            >
              {label}{id === 'approvals' && pending > 0 ? ` (${pending})` : ''}
            </button>
          ))}
          <div style={{ marginTop: 24, fontSize: 10, color: theme.muted, lineHeight: 1.5 }}>
            Pipeline: Perception → Reasoning → Report → Action
            <div style={{ marginTop: 6 }}>Gate: JeV / --mev</div>
            <div style={{ marginTop: 6, color: theme.warn }}>NO EXECUTION AUTHORIZED</div>
          </div>
        </aside>

        <main style={{ flex: 1, padding: '22px 24px', maxWidth: 1100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: theme.cyanDim, letterSpacing: 1.4 }}>YOUR INTELLIGENCE. YOUR INFRASTRUCTURE.</div>
              <h1 style={{ margin: '4px 0 6px', fontSize: 26 }}>
                {view === 'overview' ? 'Mission control' :
                  view === 'tasks' ? 'Tasks' :
                    view === 'approvals' ? 'JeV / --mev Gatekeeper' :
                      view === 'physical' ? 'Edge-Sentinel' :
                        view === 'evidence' ? 'Evidence ledger' : 'Connections'}
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: theme.muted }}>
                Orchestrate agents. Govern every action. Trace every outcome. Durable server records — not browser localStorage.
              </p>
            </div>
          </div>

          {loading && <p style={{ color: theme.muted }}>Loading Nirvana state…</p>}
          {error && (
            <div style={{
              background: 'rgba(127,29,29,0.35)', border: `1px solid ${theme.danger}`,
              color: theme.danger, padding: 12, borderRadius: 8, marginBottom: 14, fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {view === 'overview' && !loading && (
            <>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
                <Metric label="Workspace tasks" value={tasks.length} hint="Durable in this store" />
                <Metric label="Approval queue" value={pending} hint="Human decisions required" />
                <Metric label="Verified ZK receipts" value="0 / 0" hint="Prover not connected" />
                <Metric label="Inference spend" value="—" hint="No billing source connected" />
              </div>

              <Card title="Four tracks" right={<Badge tone="planned">modules</Badge>}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
                  {TRACKS.map((t) => (
                    <div key={t.id} style={{
                      background: theme.tile, border: `1px solid ${theme.panelBorder}`, borderRadius: 10, padding: 14,
                    }}>
                      <div style={{ fontSize: 22 }}>{t.icon}</div>
                      <div style={{ fontSize: 10, color: theme.muted, marginTop: 8 }}>{t.track}</div>
                      <div style={{ fontWeight: 650, marginTop: 2 }}>{t.name}</div>
                      <p style={{ fontSize: 12, color: theme.muted, margin: '8px 0' }}>{t.blurb}</p>
                      <span style={{
                        fontSize: 10, padding: '3px 8px', borderRadius: 999,
                        border: `1px solid ${theme.panelBorder}`, color: theme.warn,
                      }}>{t.status}</span>
                      <p style={{ fontSize: 11, color: theme.muted, marginTop: 8 }}>{t.detail}</p>
                      {t.href ? (
                        <Link href={t.href} style={{ fontSize: 12, color: theme.greenSoft }}>{t.hrefLabel}</Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Create task">
                <TaskForm form={form} setForm={setForm} onSubmit={createTask} busy={busy} />
              </Card>

              <Card title="Recent tasks">
                <TaskTable tasks={tasks.slice(0, 5)} empty="No tasks yet. Create your first mission." />
              </Card>
            </>
          )}

          {view === 'tasks' && (
            <>
              <Card title="New mission">
                <TaskForm form={form} setForm={setForm} onSubmit={createTask} busy={busy} />
              </Card>
              <Card
                title="All tasks"
                right={(
                  <select value={filter} onChange={(e) => setFilter(e.target.value)} style={selectStyle}>
                    <option value="all">All statuses</option>
                    <option value="Awaiting approval">Awaiting approval</option>
                    <option value="Ready — runtime unconnected">Ready — unconnected</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                )}
              >
                <TaskTable tasks={filtered} empty="No matching tasks." />
              </Card>
            </>
          )}

          {view === 'approvals' && (
            <Card
              title="--mev / JeV Gatekeeper"
              right={<span style={{
                fontSize: 11, fontWeight: 700, color: theme.warn,
                background: theme.warnBg, padding: '4px 10px', borderRadius: 6,
              }}>NO EXECUTION AUTHORIZED</span>}
            >
              <p style={{ fontSize: 12, color: theme.muted, marginTop: 0 }}>
                Approvals bind an immutable ActionManifest digest + scope + nonce + expiry.
                Deciding here updates durable server records only. Nothing deploys or runs external tools.
              </p>
              {approvals.length === 0 ? (
                <div style={{ color: theme.muted, fontSize: 13, padding: 12 }}>No decisions waiting. High-impact tasks will appear here.</div>
              ) : approvals.map((a) => (
                <div key={a.id} style={{
                  borderTop: `1px solid ${theme.panelBorder}`, padding: '14px 0',
                }}>
                  <div style={{ fontWeight: 650 }}>{a.taskName}</div>
                  <div style={{ fontSize: 12, color: theme.muted, marginTop: 4 }}>
                    {a.taskModule} · {a.taskScope} scope · rev {a.taskRevision}
                  </div>
                  <div style={{ fontSize: 11, color: theme.concept, marginTop: 6, wordBreak: 'break-all' }}>
                    action digest · {a.actionDigest}
                  </div>
                  <div style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>expires {a.expiresAt}</div>
                  <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                    <button type="button" disabled={busy} onClick={() => decide(a, 'approved')} style={btnPrimary}>Approve scope</button>
                    <button type="button" disabled={busy} onClick={() => decide(a, 'rejected')} style={btnGhost}>Reject</button>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {view === 'physical' && (
            <Card title="Edge-Sentinel · local torque check" right={<Badge tone="planned">scalar only</Badge>}>
              <p style={{ fontSize: 12, color: theme.muted }}>
                Arithmetic comparison only. Not dynamics, perception, simulation, or robot safety assurance.
                Hardware execution remains disabled.
              </p>
              <form onSubmit={runTorque} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'end' }}>
                <label style={labelStyle}>
                  Requested torque (Nm)
                  <input value={torque.torque} onChange={(e) => setTorque({ ...torque, torque: e.target.value })} style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Maximum (Nm)
                  <input value={torque.limit} onChange={(e) => setTorque({ ...torque, limit: e.target.value })} style={inputStyle} />
                </label>
                <button type="submit" disabled={busy} style={btnPrimary}>Run check</button>
              </form>
              {torque.result?.loading && <p style={{ color: theme.muted }}>Checking…</p>}
              {torque.result?.error && <p style={{ color: theme.danger }}>{torque.result.error}</p>}
              {torque.result && !torque.result.loading && !torque.result.error && (
                <pre style={{
                  marginTop: 14, padding: 12, background: theme.tile, borderRadius: 8,
                  border: `1px solid ${theme.panelBorder}`, fontSize: 12, color: torque.result.pass ? theme.green : theme.danger,
                }}>
                  {`${torque.result.label} · ${torque.result.torque} Nm requested / ${torque.result.limit} Nm maximum\nLocal arithmetic check only. Hardware execution remains disabled.`}
                </pre>
              )}
            </Card>
          )}

          {view === 'evidence' && (
            <Card
              title="Audit hash chain"
              right={(
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" disabled={busy} onClick={verifyChain} style={btnGhost}>Verify chain</button>
                  <button type="button" onClick={exportEvidence} style={btnPrimary}>Export JSON</button>
                </div>
              )}
            >
              <p style={{ fontSize: 12, color: theme.muted }}>
                SHA-256 links are hashes, not signatures or ZK proofs. No RISC Zero receipt is included.
              </p>
              {chain && (
                <div style={{
                  fontSize: 12, marginBottom: 10,
                  color: chain.ok ? theme.green : theme.danger,
                }}>
                  {chain.ok ? `PASS · ${chain.count} events checked. No independent attestation.` : `FAIL · ${chain.reason} @ seq ${chain.at}`}
                </div>
              )}
              <pre style={{
                maxHeight: 420, overflow: 'auto', background: theme.tile, padding: 12, borderRadius: 8,
                border: `1px solid ${theme.panelBorder}`, fontSize: 11, color: theme.cyanSoft, whiteSpace: 'pre-wrap',
              }}>
                {events.length
                  ? events.map((e) => `${e.time}  ${e.type}\n${JSON.stringify(e.data)}\nSHA-256 ${e.hash}\n`).join('\n')
                  : 'No events recorded.'}
              </pre>
            </Card>
          )}

          {view === 'connections' && (
            <Card title="Infrastructure registry" right={<Badge tone="planned">observed readiness</Badge>}>
              <p style={{ fontSize: 12, color: theme.muted }}>
                Only show Connected when this process actually observed the dependency. Never fabricate cloud status.
              </p>
              {(connections.length ? connections : status?.connections || []).map((c) => (
                <div key={c.id} style={{
                  display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center',
                  borderTop: `1px solid ${theme.panelBorder}`, padding: '12px 0',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: theme.muted }}>{c.detail}</div>
                  </div>
                  <span style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap',
                    border: `1px solid ${c.status === 'Connected' ? theme.greenDim : theme.panelBorder}`,
                    color: c.status === 'Connected' ? theme.green : theme.warn,
                  }}>{c.status}</span>
                </div>
              ))}
            </Card>
          )}
        </main>
      </div>

      {toastMsg ? (
        <div role="status" style={{
          position: 'fixed', bottom: 24, right: 24, background: theme.panelSolid,
          border: `1px solid ${theme.panelBorderStrong}`, color: theme.text,
          padding: '10px 14px', borderRadius: 8, fontSize: 13, maxWidth: 360,
          boxShadow: theme.glowCyan,
        }}>{toastMsg}</div>
      ) : null}
    </div>
  );
}

function TaskForm({ form, setForm, onSubmit, busy }) {
  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }}>
      <label style={labelStyle}>
        Task name
        <input
          required maxLength={120} value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Audit the deployment pipeline" style={inputStyle}
        />
      </label>
      <label style={labelStyle}>
        Specialist module
        <select value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} style={selectStyle}>
          <option>Muse-Claw DevOps</option>
          <option>Dragon Router</option>
          <option>Sentinel-Memory</option>
          <option>Edge-Sentinel</option>
        </select>
      </label>
      <label style={labelStyle}>
        Scope and acceptance criteria
        <textarea
          required maxLength={3000} value={form.description} rows={3}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Describe the desired outcome and how to check it." style={{ ...inputStyle, resize: 'vertical' }}
        />
      </label>
      <label style={labelStyle}>
        Action scope
        <select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} style={selectStyle}>
          <option value="read">Read-only analysis</option>
          <option value="write">Code or data modification · approval required</option>
          <option value="deploy">Deployment / physical action · approval required</option>
        </select>
      </label>
      <p style={{ fontSize: 11, color: theme.muted, margin: 0 }}>
        Task metadata is saved on the server. Do not include secrets or sensitive personal data.
        Approvals do not authorize live execution.
      </p>
      <div>
        <button type="submit" disabled={busy} style={btnPrimary}>{busy ? 'Saving…' : 'Create task →'}</button>
      </div>
    </form>
  );
}

function TaskTable({ tasks, empty }) {
  if (!tasks.length) return <div style={{ color: theme.muted, fontSize: 13, padding: 8 }}>{empty}</div>;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ color: theme.muted, textAlign: 'left' }}>
            <th style={th}>TASK / MODULE</th>
            <th style={th}>STATUS</th>
            <th style={th}>SCOPE</th>
            <th style={th}>CREATED</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id} style={{ borderTop: `1px solid ${theme.panelBorder}` }}>
              <td style={td}>
                {t.name}
                <div style={{ fontSize: 11, color: theme.muted }}>{t.module}</div>
              </td>
              <td style={td}><span style={tagStyle(t.status)}>{t.status}</span></td>
              <td style={td}>{t.scope}</td>
              <td style={td}>{new Date(t.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const inputStyle = {
  display: 'block', width: '100%', marginTop: 4, padding: '8px 10px', borderRadius: 8,
  border: `1px solid ${theme.panelBorder}`, background: theme.bgDeep, color: theme.text, fontSize: 13,
  boxSizing: 'border-box',
};
const selectStyle = { ...inputStyle, width: 'auto', minWidth: 180 };
const labelStyle = { fontSize: 12, color: theme.cyanSoft };
const btnPrimary = {
  background: theme.cyanDim, color: '#041018', border: 'none', borderRadius: 8,
  padding: '8px 14px', fontWeight: 650, cursor: 'pointer', fontSize: 13,
};
const btnGhost = {
  background: 'transparent', color: theme.text, border: `1px solid ${theme.panelBorder}`,
  borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13,
};
const th = { padding: '8px 6px', fontWeight: 600, fontSize: 11, letterSpacing: 0.6 };
const td = { padding: '10px 6px', verticalAlign: 'top' };
function tagStyle(status) {
  const pending = status === 'Awaiting approval';
  return {
    fontSize: 11, padding: '2px 8px', borderRadius: 999,
    border: `1px solid ${pending ? theme.warn : theme.panelBorder}`,
    color: pending ? theme.warn : theme.cyanSoft,
  };
}
