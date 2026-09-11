import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Dashboard from './Dashboard.jsx';
import { Shell, inputStyle, primaryBtn, Field } from './ui.jsx';

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <Shell><div style={{ color: '#6B6F63', fontSize: 14 }}>Loading…</div></Shell>;
  }
  if (!session) {
    return <LoginScreen />;
  }
  return <Dashboard session={session} />;
}

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setErr(error.message);
  };

  return (
    <Shell>
      <form onSubmit={submit} style={{ width: 360, maxWidth: '100%', background: '#FBFAF7', border: '1px solid #E2DED2', borderRadius: 4, padding: '36px 32px' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.08em', color: '#8A8D7F', marginBottom: 6 }}>SIGN IN</div>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 22px' }}>Insurance Ledger</h1>
        <Field label="Email"><input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} autoFocus /></Field>
        <Field label="Password"><input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} /></Field>
        {err && <div style={{ color: '#A23B33', fontSize: 13, marginBottom: 14 }}>{err}</div>}
        <button type="submit" disabled={loading} style={primaryBtn}>{loading ? 'Signing in…' : 'Sign in'}</button>
        <div style={{ fontSize: 12, color: '#9C9D8F', marginTop: 16, lineHeight: 1.5 }}>
          This account is created for you once in the Supabase dashboard — see the README. There's no public sign-up.
        </div>
      </form>
    </Shell>
  );
}
