import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './supabaseClient';
import {
  inputStyle, primaryBtnSm, ghostBtn, tinyBtn, Field, STATUS_META,
  fmtMoney, fmtDate, todayISO, paidAmount, remaining, statusOf,
} from './ui.jsx';
import EntryFormModal from './EntryFormModal.jsx';
import PaymentModal from './PaymentModal.jsx';
import ClientModal from './ClientModal.jsx';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'due', label: 'Due' },
  { id: 'paid', label: 'Paid' },
  { id: 'all', label: 'All entries' },
];

export default function Dashboard({ session }) {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('all');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState('');
  const [tab, setTab] = useState('overview');
  const [query, setQuery] = useState('');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [payEntry, setPayEntry] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const flash = () => { setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1200); };

  const loadClients = useCallback(async () => {
    const { data, error } = await supabase.from('clients').select('*').order('name');
    if (error) { setErrMsg(error.message); return; }
    setClients(data || []);
  }, []);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('entries').select('*, payments(*)').order('date_issued', { ascending: false });
    if (selectedClientId !== 'all') q = q.eq('client_id', selectedClientId);
    const { data, error } = await q;
    if (error) setErrMsg(error.message);
    else setEntries(data || []);
    setLoading(false);
  }, [selectedClientId]);

  useEffect(() => { loadClients(); }, [loadClients]);
  useEffect(() => { loadEntries(); }, [loadEntries]);

  const clientNameById = useMemo(() => {
    const m = {};
    clients.forEach(c => { m[c.id] = c.name; });
    return m;
  }, [clients]);

  const upsertEntry = async (entry) => {
    const { id, ...rest } = entry;
    let error;
    if (id) {
      ({ error } = await supabase.from('entries').update(rest).eq('id', id));
    } else {
      ({ error } = await supabase.from('entries').insert(rest));
    }
    if (error) { setErrMsg(error.message); return; }
    setShowEntryForm(false);
    flash();
    loadEntries();
  };

  const deleteEntry = async (id) => {
    const { error } = await supabase.from('entries').delete().eq('id', id);
    if (error) { setErrMsg(error.message); return; }
    flash();
    loadEntries();
  };

  const addPayment = async (entryId, payment) => {
    const { error } = await supabase.from('payments').insert({ entry_id: entryId, ...payment });
    if (error) { setErrMsg(error.message); return; }
    setPayEntry(null);
    flash();
    loadEntries();
  };

  const addClient = async (client) => {
    const { data, error } = await supabase.from('clients').insert(client).select().single();
    if (error) { setErrMsg(error.message); return; }
    await loadClients();
    setSelectedClientId(data.id);
    setShowClientModal(false);
  };

  const totals = useMemo(() => {
    let due = 0, paid = 0, overdue = 0, total = 0;
    for (const e of entries) {
      const rem = remaining(e);
      const st = statusOf(e);
      total += Number(e.amount || 0);
      paid += paidAmount(e);
      if (st === 'overdue') overdue += rem;
      if (st !== 'paid') due += rem;
    }
    return { due, paid, overdue, total };
  }, [entries]);

  const filtered = useMemo(() => {
    let list = entries;
    if (tab === 'due') list = list.filter(e => ['due', 'partial', 'overdue'].includes(statusOf(e)));
    if (tab === 'paid') list = list.filter(e => statusOf(e) === 'paid');
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(e =>
        (e.vehicle || '').toLowerCase().includes(q) ||
        (e.policy_type || '').toLowerCase().includes(q) ||
        (e.policy_number || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [entries, tab, query]);

  const exportCSV = () => {
    const header = ['Client', 'Vehicle', 'Policy Type', 'Policy Number', 'Description', 'Amount', 'Paid', 'Remaining', 'Status', 'Date Issued', 'Due Date'];
    const rows = entries.map(e => [
      clientNameById[e.client_id] || '', e.vehicle, e.policy_type, e.policy_number, e.description,
      e.amount, paidAmount(e).toFixed(2), remaining(e).toFixed(2), STATUS_META[statusOf(e)].label, e.date_issued, e.due_date,
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadBlob(csv, 'text/csv', `insurance-ledger-${todayISO()}.csv`);
  };

  const exportJSON = () => {
    downloadBlob(JSON.stringify({ exportedAt: new Date().toISOString(), clients, entries }, null, 2), 'application/json', `insurance-ledger-backup-${todayISO()}.json`);
  };

  const signOut = () => supabase.auth.signOut();

  return (
    <div style={{ minHeight: '100vh', background: '#F4F2ED', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: '#22261F' }}>
      <div style={{ borderBottom: '1px solid #E2DED2', background: '#FBFAF7', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.08em', color: '#8A8D7F' }}>INSURANCE LEDGER</div>
              <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} style={{ ...inputStyle, width: 'auto', fontSize: 16, fontWeight: 600, padding: '4px 8px', border: 'none', background: 'transparent' }}>
                <option value="all">All clients</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button onClick={() => setShowClientModal(true)} style={tinyBtn}>+ Add client</button>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: savedFlash ? '#2E7D6B' : 'transparent', transition: 'color .3s' }}>Saved</span>
            <button onClick={signOut} style={ghostBtn}>Sign out</button>
            <button onClick={() => { setEditEntry(null); setShowEntryForm(true); }} disabled={clients.length === 0} style={primaryBtnSm}>+ New entry</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 24px 60px' }}>
        {errMsg && <div style={{ background: '#FBE9E7', color: '#A23B33', padding: '10px 14px', borderRadius: 3, fontSize: 13, marginBottom: 16 }}>{errMsg}</div>}
        {clients.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9C9D8F' }}>
            <div style={{ fontSize: 14, marginBottom: 10 }}>Add your first client to start logging entries.</div>
            <button onClick={() => setShowClientModal(true)} style={primaryBtnSm}>+ Add client</button>
          </div>
        )}

        {clients.length > 0 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
              <SummaryCard label="Total balance due" value={totals.due} tone="due" />
              <SummaryCard label="Overdue" value={totals.overdue} tone="overdue" />
              <SummaryCard label="Total paid" value={totals.paid} tone="paid" />
              <SummaryCard label="Total invoiced" value={totals.total} tone="neutral" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 4, background: '#EFEBE0', padding: 4, borderRadius: 4 }}>
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)} style={{
                    padding: '7px 14px', fontSize: 13, fontWeight: 500, border: 'none', borderRadius: 3, cursor: 'pointer',
                    background: tab === t.id ? '#FBFAF7' : 'transparent', color: tab === t.id ? '#22261F' : '#7A7D6E',
                    boxShadow: tab === t.id ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  }}>{t.label}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input placeholder="Search vehicle, policy, description…" value={query} onChange={e => setQuery(e.target.value)} style={{ ...inputStyle, width: 240 }} />
                <button onClick={exportCSV} style={ghostBtn}>Export CSV</button>
                <button onClick={exportJSON} style={ghostBtn}>Backup JSON</button>
              </div>
            </div>

            {loading ? (
              <div style={{ color: '#9C9D8F', fontSize: 14, padding: 20 }}>Loading entries…</div>
            ) : (
              <EntryTable
                entries={filtered}
                showClient={selectedClientId === 'all'}
                clientNameById={clientNameById}
                onEdit={(e) => { setEditEntry(e); setShowEntryForm(true); }}
                onDelete={deleteEntry}
                onPay={(e) => setPayEntry(e)}
              />
            )}
            {!loading && filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9C9D8F', fontSize: 14 }}>No entries in this view.</div>
            )}
          </>
        )}
      </div>

      {showEntryForm && (
        <EntryFormModal
          initial={editEntry}
          clients={clients}
          defaultClientId={selectedClientId !== 'all' ? selectedClientId : (clients[0] && clients[0].id)}
          onClose={() => setShowEntryForm(false)}
          onSave={upsertEntry}
        />
      )}
      {payEntry && (
        <PaymentModal entry={payEntry} onClose={() => setPayEntry(null)} onSave={(p) => addPayment(payEntry.id, p)} />
      )}
      {showClientModal && (
        <ClientModal onClose={() => setShowClientModal(false)} onSave={addClient} />
      )}
    </div>
  );
}

function downloadBlob(content, type, filename) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function SummaryCard({ label, value, tone }) {
  const colors = { due: '#9A6B1E', overdue: '#A23B33', paid: '#2E7D6B', neutral: '#4A4D3F' };
  return (
    <div style={{ background: '#FBFAF7', border: '1px solid #E2DED2', borderRadius: 4, padding: '16px 18px' }}>
      <div style={{ fontSize: 12, color: '#8A8D7F', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, color: colors[tone], fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(value)}</div>
    </div>
  );
}

function EntryTable({ entries, showClient, clientNameById, onEdit, onDelete, onPay }) {
  const [expanded, setExpanded] = useState(null);
  if (entries.length === 0) return null;
  return (
    <div style={{ background: '#FBFAF7', border: '1px solid #E2DED2', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: '#F2EFE6', textAlign: 'left' }}>
              {[showClient && 'Client', 'Vehicle', 'Policy', 'Amount', 'Paid', 'Remaining', 'Due', 'Status', ''].filter(Boolean).map(h => (
                <th key={h} style={{ padding: '10px 14px', fontWeight: 600, color: '#6B6F63', fontSize: 11.5, borderBottom: '1px solid #E2DED2' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map(e => {
              const st = statusOf(e);
              const meta = STATUS_META[st];
              const rem = remaining(e);
              const isOpen = expanded === e.id;
              return (
                <React.Fragment key={e.id}>
                  <tr style={{ borderBottom: isOpen ? 'none' : '1px solid #ECE8DB', cursor: e.description ? 'pointer' : 'default' }}
                      onClick={() => e.description && setExpanded(isOpen ? null : e.id)}>
                    {showClient && <td style={{ padding: '11px 14px' }}>{clientNameById[e.client_id] || '—'}</td>}
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ fontWeight: 500 }}>{e.vehicle || '—'}</div>
                      <div style={{ fontSize: 12, color: '#9C9D8F' }}>{fmtDate(e.date_issued)}</div>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div>{e.policy_type || '—'}</div>
                      <div style={{ fontSize: 12, color: '#9C9D8F' }}>{e.policy_number}</div>
                    </td>
                    <td style={{ padding: '11px 14px', fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(e.amount)}</td>
                    <td style={{ padding: '11px 14px', fontVariantNumeric: 'tabular-nums', color: '#2E7D6B' }}>{fmtMoney(paidAmount(e))}</td>
                    <td style={{ padding: '11px 14px', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmtMoney(rem)}</td>
                    <td style={{ padding: '11px 14px' }}>{fmtDate(e.due_date)}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ background: meta.bg, color: meta.color, fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 20 }}>{meta.label}</span>
                    </td>
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }} onClick={ev => ev.stopPropagation()}>
                      {rem > 0.004 && <button onClick={() => onPay(e)} style={tinyBtn}>Payment</button>}
                      <button onClick={() => onEdit(e)} style={tinyBtn}>Edit</button>
                      <button onClick={() => { if (confirm('Delete this entry?')) onDelete(e.id); }} style={{ ...tinyBtn, color: '#A23B33' }}>Delete</button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr style={{ borderBottom: '1px solid #ECE8DB' }}>
                      <td colSpan={showClient ? 9 : 8} style={{ padding: '4px 14px 14px', background: '#F8F6F0', fontSize: 13, color: '#4A4D3F' }}>
                        <strong style={{ fontSize: 11, color: '#8A8D7F' }}>DESCRIPTION</strong>
                        <div style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{e.description}</div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
