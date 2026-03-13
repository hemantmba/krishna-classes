import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';

export default function ManagerDashboard() {
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('rankings');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const classes = ['6','7','8','9','10','11','12'];

  useEffect(() => {
    loadSchools();
    loadStats();
    loadSummary();
    loadRankings();
  }, []);

  useEffect(() => {
    loadRankings();
    loadStats();
  }, [selectedSchool, selectedClass, page]);

  const loadSchools = async () => {
    try {
      const res = await api.get('/manager/schools');
      setSchools(res.data.schools);
    } catch (err) {
      toast.error('Failed to load schools');
    }
  };

  const loadStats = async () => {
    try {
      const params = {};
      if (selectedSchool) params.schoolName = selectedSchool;
      const res = await api.get('/manager/stats', { params });
      setStats(res.data);
    } catch (err) {}
  };

  const loadSummary = async () => {
    try {
      const res = await api.get('/manager/school-summary');
      setSummary(res.data.summary);
    } catch (err) {}
  };

  const loadRankings = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (selectedSchool) params.schoolName = selectedSchool;
      if (selectedClass) params.className = selectedClass;
      const res = await api.get('/manager/rankings', { params });
      setStudents(res.data.students);
      setTotalPages(res.data.pages);
    } catch (err) {
      toast.error('Failed to load rankings');
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return { bg: 'linear-gradient(135deg, #FFD700, #FFA000)', label: '🥇' };
    if (rank === 2) return { bg: 'linear-gradient(135deg, #E0E0E0, #9E9E9E)', label: '🥈' };
    if (rank === 3) return { bg: 'linear-gradient(135deg, #CD7F32, #8B4513)', label: '🥉' };
    return { bg: '#f0e8d0', label: rank };
  };

  return (
    <div style={{ padding: '24px', background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Baloo 2, sans-serif', fontSize: '26px', fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
          📊 Manager Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>View student rankings by school</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { icon: '🏫', value: stats.totalSchools || 0, label: 'Total Schools' },
          { icon: '👥', value: stats.totalStudents || 0, label: 'Total Students' },
          { icon: '📝', value: stats.activeStudents || 0, label: 'Active Students' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
            <div style={{ fontFamily: 'Baloo 2, sans-serif', fontSize: '28px', fontWeight: 800, color: 'var(--navy)' }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#f0e8d8', borderRadius: '10px', padding: '4px', border: '1px solid var(--border)', marginBottom: '20px', width: 'fit-content', gap: '4px' }}>
        {[['rankings', '🏆 Student Rankings'], ['schools', '🏫 School Summary']].map(([tab, label]) => (
          <div key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '9px 20px', borderRadius: '7px',
            background: activeTab === tab ? 'var(--gold)' : 'transparent',
            color: activeTab === tab ? 'white' : 'var(--text-muted)',
            fontWeight: 600, fontSize: '13px', cursor: 'pointer'
          }}>{label}</div>
        ))}
      </div>

      {/* Rankings Tab */}
      {activeTab === 'rankings' && (
        <>
          {/* Filters */}
          <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)', display: 'block', marginBottom: '6px' }}>🏫 Filter by School</label>
                <select
                  className="form-input"
                  value={selectedSchool}
                  onChange={e => { setSelectedSchool(e.target.value); setPage(1); }}
                  style={{ width: '100%' }}
                >
                  <option value="">All Schools</option>
                  {schools.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)', display: 'block', marginBottom: '6px' }}>📚 Filter by Class</label>
                <select
                  className="form-input"
                  value={selectedClass}
                  onChange={e => { setSelectedClass(e.target.value); setPage(1); }}
                  style={{ width: '100%' }}
                >
                  <option value="">All Classes</option>
                  {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
              <button className="btn btn-outline" onClick={() => { setSelectedSchool(''); setSelectedClass(''); setPage(1); }}>
                🔄 Reset
              </button>
            </div>
          </div>

          {/* Rankings Table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, var(--navy), var(--deep))', borderRadius: '14px 14px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'white', fontWeight: 600 }}>
                🏆 Rankings {selectedSchool ? `— ${selectedSchool}` : '— All Schools'}
                {selectedClass ? ` | Class ${selectedClass}` : ''}
              </span>
              <span style={{ color: 'var(--gold)', fontSize: '13px' }}>{students.length} students</span>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                ⏳ Loading rankings...
              </div>
            ) : students.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No students found for selected filters
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--navy)' }}>
                    {['Rank', 'Student Name', 'Father Name', 'Class', 'School', 'Total Score', 'Tests', 'Avg Score'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', color: 'white', fontSize: '12px', fontWeight: 600, textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, i) => {
                    const badge = getRankBadge(student.rank);
                    return (
                      <tr key={student._id} style={{ background: i % 2 === 0 ? 'white' : '#fafaf7', borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{
                            width: '34px', height: '34px', borderRadius: '50%',
                            background: badge.bg, color: student.rank <= 3 ? 'white' : '#888',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '13px'
                          }}>
                            {badge.label}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, fontSize: '14px', color: 'var(--navy)' }}>{student.name}</td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-muted)' }}>{student.fatherName}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ background: 'rgba(26,35,126,0.1)', color: 'var(--deep)', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                            Class {student.className}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-muted)' }}>
                          {student.schoolName || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'Baloo 2, sans-serif', fontWeight: 800, fontSize: '18px', color: 'var(--navy)' }}>
                          {student.totalScore}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '14px' }}>{student.totalTests}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                            {student.avgScore}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
                <span style={{ padding: '8px 16px', fontWeight: 600, color: 'var(--navy)' }}>Page {page} of {totalPages}</span>
                <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* School Summary Tab */}
      {activeTab === 'schools' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, var(--navy), var(--deep))', borderRadius: '14px 14px 0 0' }}>
            <span style={{ color: 'white', fontWeight: 600 }}>🏫 School-wise Summary</span>
          </div>
          {summary.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No school data available. Ask students to add their school name during registration.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--navy)' }}>
                  {['#', 'School Name', 'Students', 'Total Tests', 'Avg Score', 'Top Score'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', color: 'white', fontSize: '12px', fontWeight: 600, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.map((school, i) => (
                  <tr key={school._id} style={{ background: i % 2 === 0 ? 'white' : '#fafaf7', borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--gold)' }}>#{i + 1}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--navy)' }}>{school._id}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{school.totalStudents}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{school.totalTests}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                        {school.avgScore?.toFixed(1)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'Baloo 2, sans-serif', fontWeight: 800, color: 'var(--navy)' }}>{school.topScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}