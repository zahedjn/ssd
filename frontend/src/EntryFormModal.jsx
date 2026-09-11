import React, { useState } from 'react';
import { Field, inputStyle, primaryBtnSm, ghostBtn, todayISO } from './ui.jsx';
import { ModalShell } from './ClientModal.jsx';

export default function EntryFormModal({ initial, clients, defaultClientId, onClose, onSave }) {
  const [f, setF] = useState(() => initial ? {
    id: initial.id, client_id: initial.client_id, vehicle: initial.vehicle || '',
    policy_type: initial.policy_type || '', policy_number: initial.policy_number || '',
    description: initial.description || '', amount: initial.amount ?? '',
    date_issued: initial.date_issued || todayISO(), due_date: initial.due_date || '',
  } : {
    client_id: defaultClientId || '', vehicle: '', policy_type: '', policy_number: '',
    description: '', amount: '', date_issued: todayISO(), due_date: '',
  });

  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!f.vehicle.trim() || !f.amount || !f.client_id) return;
    onSave({ ...f, amount: Number(f.amount) });
  };

  return (
    <ModalShell onClose={onClose}>
      <h2 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 18px' }}>{initial ? 'Edit entry' : 'New insurance entry'}</h2>
      <form onSubmit={submit}>
        <Field label="Client">
          <select value={f.client_id} onChange={e => set('client_id', e.target.value)} style={inputStyle}>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Vehicle / registration">
          <input value={f.vehicle} onChange={e => set('vehicle', e.target.value)} style={inputStyle} placeholder="e.g. Toyota Hilux — 1234 AB 24" />
        </Field>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}><Field label="Policy type"><input value={f.policy_type} onChange={e => set('policy_type', e.target.value)} style={inputStyle} placeholder="Comprehensive" /></Field></div>
          <div style={{ flex: 1 }}><Field label="Policy number"><input value={f.policy_number} onChange={e => set('policy_number', e.target.value)} style={inputStyle} /></Field></div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}><Field label="Amount"><input type="number" step="0.01" value={f.amount} onChange={e => set('amount', e.target.value)} style={inputStyle} /></Field></div>
          <div style={{ flex: 1 }}><Field label="Date issued"><input type="date" value={f.date_issued} onChange={e => set('date_issued', e.target.value)} style={inputStyle} /></Field></div>
        </div>
        <Field label="Due date">
          <input type="date" value={f.due_date} onChange={e => set('due_date', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Description">
          <textarea value={f.description} onChange={e => set('description', e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} placeholder="Coverage details, conditions, anything worth remembering about this policy…" />
        </Field>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button type="button" onClick={onClose} style={{ ...ghostBtn, flex: 1 }}>Cancel</button>
          <button type="submit" style={{ ...primaryBtnSm, flex: 1 }}>{initial ? 'Save changes' : 'Add entry'}</button>
        </div>
      </form>
    </ModalShell>
  );
}
