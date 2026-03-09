import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="page-title">📊 Admin Dashboard</div>
      <div className="page-subtitle">Krishna Classes Management Panel</div>

      <div className="stats-grid">
        {[
          {icon:'👥', label:'Total Students', value: stats?.totalUsers, color:'var(--deep-blue)', to:'/admin/users'},
          {icon:'❓', label:'Total Questions', value: stats?.totalQuestions, color:'var(--gold-dark)', to:'/admin/questions'},
          {icon:'📝', label:'Tests Taken', value: stats?.totalTests, color:'var(--success)', to:'/admin/reports'},
          {icon:'📤', label:'Upload Questions', value:'Add', color:'var(--navy)', to:'/admin/upload'},
        ].map(s => (
          <Link key={s.label} to={s.to} style={{textDecoration:'none'}}>
            <div className="stat-card" style={{borderLeft:`4px solid ${s.color}`, cursor:'pointer'}}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value" style={{color:s.color}}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="card">
        <div className="card-header">👥 Recent Registrations</div>
        <div style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Class</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {stats?.recentUsers?.map(u => (
                <tr key={u._id}>
                  <td style={{fontWeight:'500'}}>{u.name}</td>
                  <td><span className="badge badge-navy">Class {u.className}</span></td>
                  <td style={{color:'var(--text-muted)', fontSize:'0.85rem'}}>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'16px', marginTop:'20px'}}>
        {[
          {icon:'📤', label:'Upload Questions', sub:'Add single or bulk', to:'/admin/upload'},
          {icon:'👥', label:'Manage Users', sub:'View, activate, delete', to:'/admin/users'},
          {icon:'📋', label:'Download Reports', sub:'Excel reports', to:'/admin/reports'},
        ].map(a => (
          <Link key={a.to} to={a.to} style={{textDecoration:'none'}}>
            <div className="card" style={{padding:'20px', cursor:'pointer', transition:'var(--transition)'}}
              onMouseEnter={e=>e.currentTarget.style.transform='translateY(-4px)'}
              onMouseLeave={e=>e.currentTarget.style.transform='none'}>
              <div style={{fontSize:'2rem', marginBottom:'8px'}}>{a.icon}</div>
              <div style={{fontWeight:'700', color:'var(--navy)'}}>{a.label}</div>
              <div style={{fontSize:'0.82rem', color:'var(--text-muted)'}}>{a.sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
