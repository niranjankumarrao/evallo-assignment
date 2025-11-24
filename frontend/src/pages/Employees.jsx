import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function Employees(){
  const [list,setList]=useState([]);
  const [form,setForm]=useState({ first_name:'', last_name:'', email:'', phone:''});
  const [editing,setEditing]=useState(null);

  const load = ()=> api.get('/employees').then(r=>setList(r.data)).catch(()=>setList([]));
  useEffect(()=>{ load(); },[]);

  const submit = async e => {
    e.preventDefault();
    if(editing){
      await api.put('/employees/'+editing.id, form);
      setEditing(null);
    } else {
      await api.post('/employees', form);
    }
    setForm({ first_name:'', last_name:'', email:'', phone:''});
    load();
  };

  const edit = (it)=>{ setEditing(it); setForm({ first_name:it.first_name, last_name:it.last_name, email:it.email, phone:it.phone }); }
  const remove = async id => { if(!confirm('Delete employee?')) return; await api.delete('/employees/'+id); load(); }

  return (
    <div className="card">
      <h3>Employees</h3>
      <form className="form" onSubmit={submit} style={{maxWidth:680}}>
        <div style={{display:'flex',gap:10}}>
          <input className="input" value={form.first_name} onChange={e=>setForm({...form, first_name:e.target.value})} placeholder="First name" />
          <input className="input" value={form.last_name} onChange={e=>setForm({...form, last_name:e.target.value})} placeholder="Last name" />
        </div>
        <div style={{display:'flex',gap:10, marginTop:6}}>
          <input className="input" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} placeholder="Email" />
          <input className="input" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} placeholder="Phone" />
        </div>
        <div className="h-row" style={{marginTop:8}}>
          <button className="btn" type="submit">{editing ? 'Save' : 'Add employee'}</button>
          {editing && <button type="button" className="btn-ghost" onClick={()=>{ setEditing(null); setForm({ first_name:'', last_name:'', email:'', phone:''}); }}>Cancel</button>}
        </div>
      </form>

      <div style={{marginTop:16}}>
        <div className="list">
          {list.map(it=>(
            <div className="item" key={it.id}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div className="title">{it.first_name} {it.last_name}</div>
                  <div className="small">{it.email} • {it.phone}</div>
                </div>
                <div className="actions">
                  <button className="btn-ghost" onClick={()=>edit(it)}>Edit</button>
                  <button className="btn-ghost" onClick={()=>remove(it.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}