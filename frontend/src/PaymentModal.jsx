import React, { useState } from 'react';
import { Field, inputStyle, primaryBtnSm, ghostBtn, fmtMoney, fmtDate, todayISO, remaining } from './ui.jsx';
import { ModalShell } from './ClientModal.jsx';

export default function PaymentModal({ entry, onClose, onSave }) {
  const rem = remaining(entry);
  const [amount, setAmount] = useState(rem.toFixed(2));
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    onSave({ amount: amt, date, note: note || null });
  };

  return (
    <ModalShell onClose={onClose} width={380}>
      <h2 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 4px' }}>Record payment</h2>
      <div style={{ fontSize: 13, color: '#8A8D7F', marginBottom: 18 }}>{entry.vehicle} · balance {fmtMoney(rem)}</div>
      <form onSubmit={submit}>
        <Field label="Amount received"><input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} style={inputStyle} /></Field>
        <Field label="Date"><input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} /></Field>
        <Field label="Note (optional)"><input value={note} onChange={e => setNote(e.target.value)} style={inputStyle} placeholder="e.g. bank transfer" /></Field>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button type="button" onClick={onClose} style={{ ...ghostBtn, flex: 1 }}>Cancel</button>
          <button type="submit" style={{ ...primaryBtnSm, flex: 1 }}>Save payment</button>
        </div>
      </form>
      {(entry.payments || []).length > 0 && (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #E2DED2' }}>
          <div style={{ fontSize: 12, color: '#8A8D7F', marginBottom: 8 }}>Payment history</div>
          {entry.payments.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
              <span>{fmtDate(p.date)} {p.note && `— ${p.note}`}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(p.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  );
}
