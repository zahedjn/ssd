import React from 'react';

export function Shell({ children }) {
  return (
    <div style={{
      minHeight: '100vh', width: '100%', background: '#F4F2ED',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: '#22261F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      boxSizing: 'border-box',
    }}>
      {children}
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, color: '#6B6F63', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

export const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px', fontSize: 14,
  border: '1px solid #D9D5C7', borderRadius: 3, background: '#FFFFFF', color: '#22261F', outline: 'none',
};
export const primaryBtn = {
  width: '100%', padding: '11px 12px', fontSize: 14, fontWeight: 600, color: '#FBFAF7',
  background: '#2E4034', border: 'none', borderRadius: 3, cursor: 'pointer',
};
export const primaryBtnSm = { padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#2E4034', border: 'none', borderRadius: 3, color: '#FBFAF7', cursor: 'pointer' };
export const ghostBtn = { padding: '8px 14px', fontSize: 13, fontWeight: 500, background: 'transparent', border: '1px solid #D9D5C7', borderRadius: 3, color: '#4A4D3F', cursor: 'pointer' };
export const tinyBtn = { padding: '4px 8px', fontSize: 12, background: 'transparent', border: 'none', color: '#5B5E4F', cursor: 'pointer', textDecoration: 'underline' };

export const STATUS_META = {
  paid: { label: 'Paid', color: '#2E7D6B', bg: '#E6F2EF' },
  partial: { label: 'Partial', color: '#9A6B1E', bg: '#FBF0DE' },
  due: { label: 'Due', color: '#7A5A00', bg: '#FBF3DC' },
  overdue: { label: 'Overdue', color: '#A23B33', bg: '#FBE9E7' },
};

export const fmtMoney = (n) => {
  const v = Number(n) || 0;
  return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
export const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return '—';
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};
export const todayISO = () => new Date().toISOString().slice(0, 10);

export function paidAmount(entry) {
  return (entry.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
}
export function remaining(entry) {
  return Math.max(0, Number(entry.amount || 0) - paidAmount(entry));
}
export function statusOf(entry) {
  const rem = remaining(entry);
  if (rem <= 0.004) return 'paid';
  if (entry.due_date && entry.due_date < todayISO()) return 'overdue';
  if (paidAmount(entry) > 0) return 'partial';
  return 'due';
}
