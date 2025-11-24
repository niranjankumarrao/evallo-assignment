import React, { useState } from 'react';
import api from '../services/api';

export default function Login({ onSuccess }){
  const [email,setEmail]=useState('admin@acme.test');
  const [password,setPassword]=useState('Password123');
  const [err,setErr]=useState(null);

  const submit = async e => {
    e.preventDefault();
    try {
      const r = await api.post('/auth/login',{ email, password });
      onSuccess(r.data.token);
    } catch(err){
      setErr(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <form className="form" onSubmit={submit} style={{minWidth:280}}>
      <h3>Sign in</h3>
      <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" />
      <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" />
      <div className="h-row">
        <button className="btn" type="submit">Sign in</button>
        <button className="btn-ghost" type="button" onClick={async ()=>{ try{ const r=await api.post('/_seed'); alert('Seeded: '+JSON.stringify(r.data)); }catch(e){ alert('Already seeded or error'); } }}>Seed demo</button>
      </div>
      {err && <div className="small" style={{color:'crimson'}}>{err}</div>}
    </form>
  );
}