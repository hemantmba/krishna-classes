import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // School management
  const [schools, setSchools] = useState([]);
  const [newSchool, setNewSchool] = useState('');
  const [schoolLoading, setSchoolLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data)).finally(() => setLoading(false));
    loadSchools();
  }, []);

  const loadSchools = () => {
    api.get('/schools').then(res => setSchools(res.data.schools)).catch(() => {});
  };

  const addSchool = async () => {
    if (!newSchool.trim()) return toast.error('Enter a school name');
    setSchoolLoading(true);
    try {
      await api.post('/schools', { name: newSchool.trim() });
      toast.success('School added successfully!');
      setNewSchool('');
      loadSchools();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add school');
    } finally {
      setSchoolLoading(false);
    }
  };

  const deleteSchool = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/schools/${id}`);
      toast.success('School deleted');
      loadSchools();
    } catch (err) {
      toast.error('Failed to delete school');
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="page-title">📊 Admin Dashboard</div>
      <div className="page-subtitle">Krishna Classes Management Panel</div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {[
          { icon: '👥', label: 'Total Students', value: stats?.totalUsers, color: 'var(--deep-blue)', to: '/admin/users' },
          { icon: '❓', label: 'Total Questions', value: stats?.totalQuestions, color: 'var(--gold-dark)', to: '/admin/questions' },
          { icon: '📝', label: 'Tests Taken', value: stats?.totalTests, color: 'var(--success)', to: '/admin/reports' },
          { icon: '📤', label: 'Upload Questions', value: 'Add', color: 'var(--navy)', to: '/admin/upload' },
        ].map(s => (
          <Link key={s.label} to={s.to} style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ borderLeft: `4px solid ${s.color}`, cursor: 'pointer' }}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* School Management */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🏫 Manage Schools</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
            {schools.length} schools registered
          </span>
        </div>

        {/* Add School */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              className="form-input"
              style={{ flex: 1 }}
              placeholder="Enter school name e.g. Ram Lal Inter College, Agra"
              value={newSchool}
              onChange={e => setNewSchool(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSchool()}
            />
            <button
              className="btn btn-primary"
              onClick={addSchool}
              disabled={schoolLoading}
              style={{ whiteSpace: 'nowrap' }}
            >
              {schoolLoading ? '⏳' : '➕ Add School'}
            </button>
          </div>
        </div>

        {/* Schools List */}
        {schools.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No schools added yet. Add schools so students can select them during registration.
          </div>
        ) : (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {schools.map((school, i) => (
              <div key={school._id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 20px',
                background: i % 2 === 0 ? 'white' : '#fafaf7',
                borderBottom: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: '28px', height: '28px', background: 'var(--navy)', color: 'white',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700, flexShrink: 0
                  }}>{i + 1}</span>
                  <span style={{ fontWeight: 500, color: 'var(--text)' }}>{school.name}</span>
                </div>
                <button
                  onClick={() => deleteSchool(school._id, school.name)}
                  style={{
                    background: '#fff0f0', border: '1px solid #ffcccc', color: '#cc0000',
                    padding: '4px 12px', borderRadius: '6px', cursor: 'pointer',
                    fontSize: '12px', fontWeight: 600
                  }}
                >
                  🗑 Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Registrations */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">👥 Recent Registrations</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Class</th>
                <th>School</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentUsers?.map(u => (
                <tr key={u._id}>
                  <td style={{ fontWeight: '500' }}>{u.name}</td>
                  <td><span className="badge badge-navy">Class {u.className}</span></td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{u.schoolName || '—'}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { icon: '📤', label: 'Upload Questions', sub: 'Add single or bulk', to: '/admin/upload' },
          { icon: '👥', label: 'Manage Users', sub: 'View, activate, delete', to: '/admin/users' },
          { icon: '📋', label: 'Download Reports', sub: 'Excel reports', to: '/admin/reports' },
        ].map(a => (
          <Link key={a.to} to={a.to} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: '20px', cursor: 'pointer', transition: 'var(--transition)' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{a.icon}</div>
              <div style={{ fontWeight: '700', color: 'var(--navy)' }}>{a.label}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{a.sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}