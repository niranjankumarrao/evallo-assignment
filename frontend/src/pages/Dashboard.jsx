import React, { useState, useEffect } from 'react';
export default function Dashboard(){ 
  return (
    <div className="card">
      <h3>Overview</h3>
      <p className="muted">Use the navigation to manage employees and teams. The system records an audit trail for operations.</p>
      <div className="h-row" style={{marginTop:12}}>
        <div className="item" style={{flex:1}}>
          <div className="title">Employees</div>
          <div className="small">Create and edit employee records</div>
        </div>
        <div className="item" style={{flex:1}}>
          <div className="title">Teams</div>
          <div className="small">Create teams and assign employees to teams</div>
        </div>
      </div>
    </div>
  );
}