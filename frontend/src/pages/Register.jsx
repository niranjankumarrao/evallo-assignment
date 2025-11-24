import React, { useState } from 'react';
import api from '../services/api';

export default function Register({ onSuccess }){
  const [orgName,setOrgName]=useState('My Tutoring Org');
  const [name,setName]=useState('Admin');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [msg,setMsg]=useState(null);

  const submit = async e => {
    e.preventDefault();
    try {
      const r = await api.post('/auth/register',{ orgName, adminName:name, email, password });
      onSuccess(r.data.token);
    } catch(err){
      setMsg(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <form className="form" onSubmit={submit} style={{minWidth:280}}>
      <h3>Create organisation</h3>
      <input className="input" value={orgName} onChange={e=>setOrgName(e.target.value)} placeholder="Organisation name" />
      <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Admin name" />
      <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" />
      <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" />
      <button className="btn" type="submit">Create</button>
      {msg && <div className="small" style={{color:'crimson'}}>{msg}</div>}
    </form>
  );
}