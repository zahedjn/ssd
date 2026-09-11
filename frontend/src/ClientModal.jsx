import React, { useState } from 'react';
import { Field, inputStyle, primaryBtnSm, ghostBtn } from './ui.jsx';

export function ModalShell({ children, onClose, width = 460 }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(34,38,31,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
      <div onClick={e => e.stopPropagation()} style={{ width, maxWidth: '100%', maxHeight: '88vh', overflowY: 'auto', background: '#FBFAF7', borderRadius: 5, padding: 28, boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}>
        {children}
      </div>
    </div>
  );
}

export default function ClientModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), notes: notes.trim() || null });
  };

  return (
    <ModalShell onClose={onClose} width={380}>
      <h2 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 18px' }}>Add client</h2>
      <form onSubmit={submit}>
        <Field label="Client / insurer name"><input value={name} onChange={e => setName(e.target.value)} style={inputStyle} autoFocus /></Field>
        <Field label="Notes (optional)"><input value={notes} onChange={e => setNotes(e.target.value)} style={inputStyle} /></Field>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button type="button" onClick={onClose} style={{ ...ghostBtn, flex: 1 }}>Cancel</button>
          <button type="submit" style={{ ...primaryBtnSm, flex: 1 }}>Add client</button>
        </div>
      </form>
    </ModalShell>
  );
}
