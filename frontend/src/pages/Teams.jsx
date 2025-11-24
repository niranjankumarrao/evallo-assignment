import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function Teams(){
  const [list,setList]=useState([]);
  const [employees,setEmployees]=useState([]);
  const [form,setForm]=useState({ name:'', description:''});
  const [selectedTeam,setSelectedTeam]=useState(null);

  const load = ()=> Promise.all([api.get('/teams'), api.get('/employees')])
    .then(([a,b])=>{ setList(a.data); setEmployees(b.data); })
    .catch(()=>{ setList([]); setEmployees([]); });

  useEffect(()=>{ load(); },[]);

  const submit = async e => {
    e.preventDefault();
    if(selectedTeam){
      await api.put('/teams/'+selectedTeam.id, form);
      setSelectedTeam(null);
    } else {
      await api.post('/teams', form);
    }
    setForm({ name:'', description:''});
    load();
  };

  const edit = (t)=>{ setSelectedTeam(t); setForm({ name:t.name, description:t.description }); }
  const remove = async id => { if(!confirm('Delete team?')) return; await api.delete('/teams/'+id); load(); }

  const assign = async (teamId, employeeId) => {
    await api.post('/teams/'+teamId+'/assign', { employeeId });
    load();
  };
  const unassign = async (teamId, employeeId) => {
    await api.post('/teams/'+teamId+'/unassign', { employeeId });
    load();
  };

  return (
    <div className="card">
      <h3>Teams</h3>
      <form className="form" onSubmit={submit} style={{maxWidth:680}}>
        <input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Team name" />
        <textarea className="input" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Description" />
        <div className="h-row">
          <button className="btn" type="submit">{selectedTeam ? 'Save' : 'Create team'}</button>
          {selectedTeam && <button type="button" className="btn-ghost" onClick={()=>{ setSelectedTeam(null); setForm({ name:'', description:''}); }}>Cancel</button>}
        </div>
      </form>

      <div style={{marginTop:16}}>
        <div className="list">
          {list.map(team=>(
            <div className="item" key={team.id}>
              <div className="title">{team.name} <span className="small">({team.member_count})</span></div>
              <div className="small">{team.description}</div>
              <div style={{marginTop:8}}>
                <div className="small">Members</div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:8}}>
                  {employees.map(emp=>{
                    const assigned = false; // we don't have per-team members in employees list here
                    return (
                      <div key={emp.id} style={{display:'flex',gap:8,alignItems:'center'}}>
                        <div className="small">{emp.first_name}</div>
                        <div>
                          <button className="btn-ghost" onClick={()=>assign(team.id, emp.id)}>Assign</button>
                          <button className="btn-ghost" onClick={()=>unassign(team.id, emp.id)}>Unassign</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="actions" style={{marginTop:8}}>
                <button className="btn-ghost" onClick={()=>edit(team)}>Edit</button>
                <button className="btn-ghost" onClick={()=>remove(team.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}