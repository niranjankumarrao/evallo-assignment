import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Teams from './pages/Teams';
import api from './services/api';

function App(){
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [view, setView] = useState(token ? 'dashboard' : 'login');

  useEffect(()=>{
    if(token){ localStorage.setItem('token', token); setView('dashboard'); }
    else { localStorage.removeItem('token'); setView('login'); }
  },[token]);

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch(e){}
    setToken(null);
  };

  const Nav = ()=> (
    <div className="nav">
      <div className="brand">Evallo HRMS</div>
      <div className="nav-links">
        <button onClick={()=>setView('dashboard')}>Dashboard</button>
        <button onClick={()=>setView('employees')}>Employees</button>
        <button onClick={()=>setView('teams')}>Teams</button>
        <button onClick={()=>setView('logs')}>Logs</button>
        <button className="btn-logout" onClick={logout}>Logout</button>
      </div>
    </div>
  );

  if(!token){
    return <div className="centered">
      <div className="card">
        <h2>Welcome — Evallo HRMS</h2>
        <p className="muted">Small HR system for tutoring businesses</p>
        <div className="row">
          <Login onSuccess={t=>setToken(t)} />
          <Register onSuccess={t=>setToken(t)} />
        </div>
      </div>
    </div>
  }

  return (
    <div>
      <Nav />
      <div className="container">
        {view==='dashboard' && <Dashboard api={api} />}
        {view==='employees' && <Employees api={api} />}
        {view==='teams' && <Teams api={api} />}
        {view==='logs' && <Logs api={api} />}
      </div>
    </div>
  );
}

/* Simple Logs page inline to keep file count small */
function Logs({api}) {
  const [logs, setLogs] = useState([]);
  useEffect(()=>{ api.get('/logs').then(r=>setLogs(r.data)).catch(()=>setLogs([])); },[]);
  return (
    <div className="card">
      <h3>Audit Trail</h3>
      {logs.length===0 && <p className="muted">No logs yet.</p>}
      <ul className="log-list">
        {logs.map(l=>(
          <li key={l.id}>
            <div><strong>{l.action}</strong> — <span className="muted">{new Date(l.timestamp).toLocaleString()}</span></div>
            <div className="meta">{JSON.stringify(l.meta)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;