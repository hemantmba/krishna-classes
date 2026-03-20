import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const CLASSES = ['1','2','3','4','5','6','7','8','9','10','11','12','BA','BSC','BCOM','Other'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const SUBJECTS = ['Science', 'Maths', 'English', 'Hindi', 'Social Science', 'Sanskrit', 'Other'];

const defaultEditForm = {
  questionText: '', isLatex: false,
  options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
  correctOption: 0,
  className: '', chapter: '', subject: '', medium: 'hindi', difficulty: 'medium', explanation: ''
};

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState('rankings');

  // Rankings state
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState([]);
  const [stats, setStats] = useState({});
  const [rankingsLoading, setRankingsLoading] = useState(false);
  const [rankTab, setRankTab] = useState('rankings');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Questions state
  const [myQuestions, setMyQuestions] = useState([]);
  const [qLoading, setQLoading] = useState(false);
  const [qPage, setQPage] = useState(1);
  const [qTotalPages, setQTotalPages] = useState(1);
  const [qStatusFilter, setQStatusFilter] = useState('');

  // Upload state
  const [uploadForm, setUploadForm] = useState({ medium: 'hindi', className: '', chapter: '', subject: '' });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  // Edit modal state
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState(defaultEditForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const classes = ['6','7','8','9','10','11','12'];

  useEffect(() => {
    loadSchools();
    loadStats();
    loadSummary();
    loadRankings();
  }, []);

  useEffect(() => { loadRankings(); loadStats(); }, [selectedSchool, selectedClass, page]);
  useEffect(() => { if (activeTab === 'questions') loadMyQuestions(); }, [activeTab, qPage, qStatusFilter]);

  const loadSchools = async () => {
    try { const res = await api.get('/manager/schools'); setSchools(res.data.schools); } catch {}
  };
  const loadStats = async () => {
    try {
      const params = {};
      if (selectedSchool) params.schoolName = selectedSchool;
      const res = await api.get('/manager/stats', { params });
      setStats(res.data);
    } catch {}
  };
  const loadSummary = async () => {
    try { const res = await api.get('/manager/school-summary'); setSummary(res.data.summary); } catch {}
  };
  const loadRankings = async () => {
    setRankingsLoading(true);
    try {
      const params = { page, limit: 20 };
      if (selectedSchool) params.schoolName = selectedSchool;
      if (selectedClass) params.className = selectedClass;
      const res = await api.get('/manager/rankings', { params });
      setStudents(res.data.students);
      setTotalPages(res.data.pages);
    } catch { toast.error('Failed to load rankings'); }
    finally { setRankingsLoading(false); }
  };
  const loadMyQuestions = async () => {
    setQLoading(true);
    try {
      const params = { page: qPage, limit: 15 };
      if (qStatusFilter) params.status = qStatusFilter;
      const res = await api.get('/questions/manager-questions', { params });
      setMyQuestions(res.data.questions);
      setQTotalPages(res.data.pages);
    } catch { toast.error('Failed to load questions'); }
    finally { setQLoading(false); }
  };

  // Upload CSV
  const handleUpload = async () => {
    const file = fileRef.current?.files[0];
    if (!file) return toast.error('Please select a CSV or XLSX file');
    if (!uploadForm.className) return toast.error('Please select a class');
    if (!uploadForm.chapter.trim()) return toast.error('Please enter chapter name');

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('medium', uploadForm.medium);
      fd.append('className', uploadForm.className);
      fd.append('chapter', uploadForm.chapter);
      fd.append('subject', uploadForm.subject);
      const res = await api.post('/questions/manager-bulk', fd);
      toast.success(res.data.message);
      fileRef.current.value = '';
      setUploadForm({ medium: 'hindi', className: '', chapter: '', subject: '' });
      loadMyQuestions();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally { setUploading(false); }
  };

  // Open edit modal
  const openEdit = (q) => {
    setEditId(q._id);
    setEditForm({
      questionText: q.questionText || '',
      isLatex: q.isLatex || false,
      options: q.options?.map(o => ({ text: o.text || '' })) || [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
      correctOption: q.correctOption ?? 0,
      className: q.className || '',
      chapter: q.chapter || '',
      subject: q.subject || '',
      medium: q.medium || 'hindi',
      difficulty: q.difficulty || 'medium',
      explanation: q.explanation || ''
    });
    setEditModal(true);
  };

  const saveEdit = async () => {
    if (!editForm.questionText.trim()) return toast.error('Question text is required');
    if (editForm.options.some(o => !o.text.trim())) return toast.error('All 4 options are required');
    setSaving(true);
    try {
      await api.put(`/questions/${editId}/manager-edit`, editForm);
      toast.success('Edit submitted for admin approval!');
      setEditModal(false);
      loadMyQuestions();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit edit');
    } finally { setSaving(false); }
  };

  const setOptionText = (idx, value) => {
    const updated = editForm.options.map((o, i) => i === idx ? { ...o, text: value } : o);
    setEditForm({ ...editForm, options: updated });
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return { bg: 'linear-gradient(135deg, #FFD700, #FFA000)', label: '🥇' };
    if (rank === 2) return { bg: 'linear-gradient(135deg, #E0E0E0, #9E9E9E)', label: '🥈' };
    if (rank === 3) return { bg: 'linear-gradient(135deg, #CD7F32, #8B4513)', label: '🥉' };
    return { bg: '#f0e8d0', label: rank };
  };

  const statusBadge = (status) => {
    if (status === 'approved') return { bg: '#e8f5e9', color: '#2e7d32', label: '✅ Approved' };
    if (status === 'pending') return { bg: '#fff8e1', color: '#f57f17', label: '⏳ Pending' };
    return { bg: '#ffebee', color: '#c62828', label: '❌ Rejected' };
  };

  return (
    <div style={{ padding: '24px', background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Baloo 2, sans-serif', fontSize: '26px', fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
          📊 Manager Dashboard
        </h1>
      </div>

      {/* Stats */}
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

      {/* Main Tabs */}
      <div style={{ display: 'flex', background: '#f0e8d8', borderRadius: '10px', padding: '4px', border: '1px solid var(--border)', marginBottom: '20px', width: 'fit-content', gap: '4px' }}>
        {[['rankings', '🏆 Rankings'], ['questions', '❓ My Questions'], ['upload', '📤 Upload Questions']].map(([tab, label]) => (
          <div key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '9px 20px', borderRadius: '7px',
            background: activeTab === tab ? 'var(--gold)' : 'transparent',
            color: activeTab === tab ? 'white' : 'var(--text-muted)',
            fontWeight: 600, fontSize: '13px', cursor: 'pointer'
          }}>{label}</div>
        ))}
      </div>

      {/* ── RANKINGS TAB ── */}
      {activeTab === 'rankings' && (
        <>
          <div style={{ display: 'flex', background: '#f0e8d8', borderRadius: '10px', padding: '4px', border: '1px solid var(--border)', marginBottom: '20px', width: 'fit-content', gap: '4px' }}>
            {[['rankings', '🏆 Student Rankings'], ['schools', '🏫 School Summary']].map(([tab, label]) => (
              <div key={tab} onClick={() => setRankTab(tab)} style={{
                padding: '8px 18px', borderRadius: '7px',
                background: rankTab === tab ? 'var(--navy)' : 'transparent',
                color: rankTab === tab ? 'white' : 'var(--text-muted)',
                fontWeight: 600, fontSize: '13px', cursor: 'pointer'
              }}>{label}</div>
            ))}
          </div>

          {rankTab === 'rankings' && (
            <>
              <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)', display: 'block', marginBottom: '6px' }}>🏫 Filter by School</label>
                    <select className="form-input" value={selectedSchool} onChange={e => { setSelectedSchool(e.target.value); setPage(1); }} style={{ width: '100%' }}>
                      <option value="">All Schools</option>
                      {schools.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)', display: 'block', marginBottom: '6px' }}>📚 Filter by Class</label>
                    <select className="form-input" value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setPage(1); }} style={{ width: '100%' }}>
                      <option value="">All Classes</option>
                      {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
                    </select>
                  </div>
                  <button className="btn btn-outline" onClick={() => { setSelectedSchool(''); setSelectedClass(''); setPage(1); }}>🔄 Reset</button>
                </div>
              </div>

              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, var(--navy), var(--deep))', borderRadius: '14px 14px 0 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'white', fontWeight: 600 }}>🏆 Rankings {selectedSchool ? `— ${selectedSchool}` : '— All Schools'}</span>
                  <span style={{ color: 'var(--gold)', fontSize: '13px' }}>{students.length} students</span>
                </div>
                {rankingsLoading ? (
                  <div style={{ padding: '40px', textAlign: 'center' }}>⏳ Loading...</div>
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
                              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: badge.bg, color: student.rank <= 3 ? 'white' : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>{badge.label}</div>
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--navy)' }}>{student.name}</td>
                            <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-muted)' }}>{student.fatherName}</td>
                            <td style={{ padding: '12px 14px' }}><span style={{ background: 'rgba(26,35,126,0.1)', color: 'var(--deep)', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>Class {student.className}</span></td>
                            <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-muted)' }}>{student.schoolName || '—'}</td>
                            <td style={{ padding: '12px 14px', fontFamily: 'Baloo 2, sans-serif', fontWeight: 800, fontSize: '18px', color: 'var(--navy)' }}>{student.totalScore}</td>
                            <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{student.totalTests}</td>
                            <td style={{ padding: '12px 14px' }}><span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>{student.avgScore}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
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

          {rankTab === 'schools' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, var(--navy), var(--deep))', borderRadius: '14px 14px 0 0' }}>
                <span style={{ color: 'white', fontWeight: 600 }}>🏫 School-wise Summary</span>
              </div>
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
                      <td style={{ padding: '12px 14px' }}><span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>{school.avgScore?.toFixed(1)}</span></td>
                      <td style={{ padding: '12px 14px', fontFamily: 'Baloo 2, sans-serif', fontWeight: 800, color: 'var(--navy)' }}>{school.topScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── MY QUESTIONS TAB ── */}
      {activeTab === 'questions' && (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
            <select className="form-input" style={{ maxWidth: '160px' }} value={qStatusFilter} onChange={e => { setQStatusFilter(e.target.value); setQPage(1); }}>
              <option value="">All Status</option>
              <option value="pending">⏳ Pending</option>
              <option value="approved">✅ Approved</option>
              <option value="rejected">❌ Rejected</option>
            </select>
            <button className="btn btn-outline btn-sm" onClick={loadMyQuestions}>🔄 Refresh</button>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            {qLoading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>⏳ Loading...</div>
            ) : myQuestions.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No questions found. Upload questions using the Upload tab!
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--navy)' }}>
                    {['#', 'Question', 'Class', 'Chapter', 'Difficulty', 'Status', 'Action'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', color: 'white', fontSize: '12px', fontWeight: 600, textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myQuestions.map((q, i) => {
                    const badge = statusBadge(q.status);
                    return (
                      <tr key={q._id} style={{ background: i % 2 === 0 ? 'white' : '#fafaf7', borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '13px' }}>{(qPage - 1) * 15 + i + 1}</td>
                        <td style={{ padding: '10px 14px', maxWidth: '260px' }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 500 }}>
                            {q.pendingData?.questionText ? '✏️ ' : ''}{q.questionText}
                          </div>
                          {q.pendingData?.questionText && (
                            <div style={{ fontSize: '11px', color: 'var(--gold)', marginTop: '2px' }}>Edit pending approval</div>
                          )}
                          {q.rejectedReason && (
                            <div style={{ fontSize: '11px', color: '#c62828', marginTop: '2px' }}>Reason: {q.rejectedReason}</div>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px' }}><span style={{ background: 'rgba(26,35,126,0.1)', color: 'var(--deep)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>Class {q.className}</span></td>
                        <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-muted)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.chapter}</td>
                        <td style={{ padding: '10px 14px' }}><span style={{ fontSize: '11px', fontWeight: 600, color: q.difficulty === 'easy' ? '#2e7d32' : q.difficulty === 'hard' ? '#c62828' : '#f57f17' }}>{q.difficulty}</span></td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ background: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>{badge.label}</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <button
                            className="btn btn-sm"
                            style={{ background: 'var(--navy)', color: 'white', opacity: q.status === 'pending' && q.pendingData?.questionText ? 0.5 : 1 }}
                            onClick={() => openEdit(q)}
                            disabled={q.status === 'pending' && !!q.pendingData?.questionText}
                            title={q.pendingData?.questionText ? 'Edit already pending approval' : 'Edit question'}
                          >
                            ✏️ Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {qTotalPages > 1 && (
              <div style={{ padding: '14px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setQPage(p => Math.max(1, p - 1))} disabled={qPage === 1}>← Prev</button>
                <span style={{ padding: '8px 14px', fontWeight: 600, color: 'var(--navy)' }}>Page {qPage}/{qTotalPages}</span>
                <button className="btn btn-outline btn-sm" onClick={() => setQPage(p => Math.min(qTotalPages, p + 1))} disabled={qPage === qTotalPages}>Next →</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── UPLOAD TAB ── */}
      {activeTab === 'upload' && (
        <div className="card" style={{ padding: '28px', maxWidth: '600px' }}>
          <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--navy)', marginBottom: '20px' }}>📤 Upload Questions (CSV/XLSX)</div>
          <div style={{ background: '#fff8e1', border: '1px solid var(--gold)', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#7a5800' }}>
            ⚠️ Your uploaded questions will be sent to admin for approval before they appear in tests.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Class *</label>
              <select className="form-input form-select" value={uploadForm.className} onChange={e => setUploadForm({ ...uploadForm, className: e.target.value })}>
                <option value="">Select Class</option>
                {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Medium *</label>
              <select className="form-input form-select" value={uploadForm.medium} onChange={e => setUploadForm({ ...uploadForm, medium: e.target.value })}>
                <option value="hindi">हिंदी (Hindi)</option>
                <option value="english">English</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Chapter *</label>
              <input className="form-input" placeholder="e.g. Motion" value={uploadForm.chapter} onChange={e => setUploadForm({ ...uploadForm, chapter: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <select className="form-input form-select" value={uploadForm.subject} onChange={e => setUploadForm({ ...uploadForm, subject: e.target.value })}>
                <option value="">Select Subject</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">CSV / XLSX File *</label>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="form-input" style={{ padding: '8px' }} />
          </div>

          <button className="btn btn-primary btn-full" onClick={handleUpload} disabled={uploading}>
            {uploading ? '⏳ Uploading...' : '📤 Submit for Approval'}
          </button>

          <div style={{ marginTop: '20px', background: 'var(--bg)', borderRadius: '8px', padding: '14px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <div style={{ fontWeight: 700, marginBottom: '6px' }}>📋 CSV Format:</div>
            <code style={{ fontSize: '11px' }}>question, optionA, optionB, optionC, optionD, answer, explanation, difficulty, isLatex</code>
            <div style={{ marginTop: '6px' }}>answer must be A/B/C/D • difficulty: easy/medium/hard</div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy)' }}>✏️ Edit Question</div>
              <button onClick={() => setEditModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ background: '#fff8e1', border: '1px solid var(--gold)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#7a5800' }}>
              ⚠️ Your edit will be sent to admin for approval. Original question stays until approved.
            </div>

            <div className="form-group">
              <label className="form-label">Question Text *</label>
              <textarea className="form-input" rows={3} style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }}
                value={editForm.questionText} onChange={e => setEditForm({ ...editForm, questionText: e.target.value })}
                placeholder="Use $formula$ for LaTeX" />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="mgr_isLatex" checked={editForm.isLatex}
                onChange={e => setEditForm({ ...editForm, isLatex: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              <label htmlFor="mgr_isLatex" style={{ cursor: 'pointer', fontWeight: 500 }}>Contains LaTeX formula</label>
            </div>

            <div className="form-group">
              <label className="form-label">Options * (select correct answer)</label>
              {editForm.options.map((opt, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <input type="radio" name="mgr_correct" checked={editForm.correctOption === idx}
                    onChange={() => setEditForm({ ...editForm, correctOption: idx })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 }} />
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, background: editForm.correctOption === idx ? 'var(--gold)' : 'var(--navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px' }}>
                    {['A','B','C','D'][idx]}
                  </div>
                  <input className="form-input" style={{ flex: 1, border: editForm.correctOption === idx ? '2px solid var(--gold)' : undefined }}
                    placeholder={`Option ${['A','B','C','D'][idx]}`} value={opt.text}
                    onChange={e => setOptionText(idx, e.target.value)} />
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Class</label>
                <select className="form-input form-select" value={editForm.className} onChange={e => setEditForm({ ...editForm, className: e.target.value })}>
                  <option value="">Select</option>
                  {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Chapter</label>
                <input className="form-input" value={editForm.chapter} onChange={e => setEditForm({ ...editForm, chapter: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Difficulty</label>
                <select className="form-input form-select" value={editForm.difficulty} onChange={e => setEditForm({ ...editForm, difficulty: e.target.value })}>
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button className="btn btn-outline btn-full" onClick={() => setEditModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-full" onClick={saveEdit} disabled={saving}>
                {saving ? '⏳ Submitting...' : '✅ Submit for Approval'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}