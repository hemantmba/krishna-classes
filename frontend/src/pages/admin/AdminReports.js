import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const CLASSES = ['1','2','3','4','5','6','7','8','9','10','11','12','BA','BSC','BCOM'];

export default function AdminReports() {
  const [filters, setFilters] = useState({ className: '', chapter: '', isActive: '', schoolName: '' });
  const [loading, setLoading] = useState({ users: false, ranks: false });
  const [schools, setSchools] = useState([]);

  useEffect(() => {
    api.get('/schools').then(res => setSchools(res.data.schools)).catch(() => {});
  }, []);

  const downloadReport = async (type) => {
    setLoading(l => ({ ...l, [type]: true }));
    try {
      const params = {};
      if (filters.className) params.className = filters.className;
      if (filters.schoolName) params.schoolName = filters.schoolName;

      if (type === 'users') {
        if (filters.isActive !== '') params.isActive = filters.isActive;
      } else {
        if (filters.chapter) params.chapter = filters.chapter;
      }

      const res = await api.get(`/admin/reports/${type}`, { params, responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `krishna_classes_${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded successfully!');
    } catch (err) {
      toast.error('Failed to download report');
    } finally {
      setLoading(l => ({ ...l, [type]: false }));
    }
  };

  return (
    <div className="page">
      <div className="page-title">📋 Reports & Analytics</div>
      <div className="page-subtitle">Download Excel reports with filters</div>

      {/* Filters */}
      <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ fontWeight: '700', color: 'var(--navy)', marginBottom: '16px' }}>🔍 Filter Options</div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)' }}>Class</label>
            <select className="form-input form-select" style={{ minWidth: '140px' }}
              value={filters.className} onChange={e => setFilters({ ...filters, className: e.target.value })}>
              <option value="">All Classes</option>
              {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)' }}>School</label>
            <select className="form-input form-select" style={{ minWidth: '200px' }}
              value={filters.schoolName} onChange={e => setFilters({ ...filters, schoolName: e.target.value })}>
              <option value="">All Schools</option>
              {schools.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)' }}>Chapter (ranks report)</label>
            <input className="form-input" style={{ minWidth: '200px' }} placeholder="e.g. Motion"
              value={filters.chapter} onChange={e => setFilters({ ...filters, chapter: e.target.value })} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)' }}>Status (students report)</label>
            <select className="form-input form-select" style={{ minWidth: '140px' }}
              value={filters.isActive} onChange={e => setFilters({ ...filters, isActive: e.target.value })}>
              <option value="">All Status</option>
              <option value="true">Active Only</option>
              <option value="false">Blocked Only</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'flex-end' }}>
            <button className="btn btn-outline btn-sm"
              onClick={() => setFilters({ className: '', chapter: '', isActive: '', schoolName: '' })}>
              🔄 Clear Filters
            </button>
          </div>
        </div>

        {/* Active filters display */}
        {(filters.className || filters.schoolName || filters.chapter) && (
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {filters.className && (
              <span style={{ background: 'var(--navy)', color: 'white', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                📚 Class {filters.className}
              </span>
            )}
            {filters.schoolName && (
              <span style={{ background: 'var(--gold)', color: 'white', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                🏫 {filters.schoolName}
              </span>
            )}
            {filters.chapter && (
              <span style={{ background: 'var(--success)', color: 'white', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                📖 {filters.chapter}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Report Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

        {/* Students Report */}
        <div className="card" style={{ padding: '28px', borderLeft: '4px solid var(--deep-blue)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>👥</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--navy)', marginBottom: '8px' }}>
            Students Report
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px', lineHeight: 1.7 }}>
            Includes all fields:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
            {['S.No', 'Name', 'Father Name', 'Class', 'School Name', 'Email', 'Language', 'Total Score', 'Total Tests', 'Avg Score', 'Status', 'Role', 'Joined Date'].map(f => (
              <span key={f} style={{ background: 'rgba(26,35,126,0.08)', color: 'var(--navy)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>
                {f}
              </span>
            ))}
          </div>
          <button className="btn btn-secondary btn-full" onClick={() => downloadReport('users')} disabled={loading.users}>
            {loading.users ? '⏳ Generating...' : '📥 Download Students Report (XLSX)'}
          </button>
        </div>

        {/* Rankings Report */}
        <div className="card" style={{ padding: '28px', borderLeft: '4px solid var(--gold-dark)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🏆</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--navy)', marginBottom: '8px' }}>
            Rankings Report
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px', lineHeight: 1.7 }}>
            {filters.chapter ? 'Chapter-wise fields:' : 'Overall ranking fields:'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
            {filters.chapter
              ? ['Rank', 'Name', 'Father Name', 'Class', 'School Name', 'Email', 'Language', 'Chapter', 'Subject', 'Best Score', 'Max Score', 'Percentage', 'Time Taken', 'Attempts'].map(f => (
                <span key={f} style={{ background: 'rgba(184,134,11,0.1)', color: 'var(--gold-dark)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>
                  {f}
                </span>
              ))
              : ['Rank', 'Name', 'Father Name', 'Class', 'School Name', 'Email', 'Language', 'Total Score', 'Total Tests', 'Avg Score'].map(f => (
                <span key={f} style={{ background: 'rgba(184,134,11,0.1)', color: 'var(--gold-dark)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>
                  {f}
                </span>
              ))
            }
          </div>
          <button className="btn btn-primary btn-full" onClick={() => downloadReport('ranks')} disabled={loading.ranks}>
            {loading.ranks ? '⏳ Generating...' : '📥 Download Rankings Report (XLSX)'}
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="card" style={{ padding: '24px', marginTop: '20px', background: 'var(--gold-pale)', border: '1px solid var(--gold)' }}>
        <div style={{ fontWeight: '700', color: 'var(--gold-dark)', marginBottom: '8px' }}>💡 Tips</div>
        <ul style={{ color: 'var(--text-muted)', fontSize: '0.88rem', paddingLeft: '20px', lineHeight: '2' }}>
          <li>Leave all filters empty to download the <strong>full report</strong> of all students</li>
          <li>Select a <strong>School</strong> to get report of only that school's students</li>
          <li>For <strong>chapter-wise rank report</strong>: select class + enter chapter name</li>
          <li>For <strong>class-wise rank report</strong>: select only the class</li>
          <li>Reports open in Microsoft Excel or Google Sheets (.xlsx format)</li>
          <li>Chapter-wise report includes: Best Score, Percentage, Time Taken, Attempts</li>
        </ul>
      </div>
    </div>
  );
}