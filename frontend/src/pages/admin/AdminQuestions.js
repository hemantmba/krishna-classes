import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const CLASSES = ['1','2','3','4','5','6','7','8','9','10','11','12','BA','BSC','BCOM','Other'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const SUBJECTS = ['Science', 'Maths', 'English', 'Hindi', 'Social Science', 'Sanskrit', 'Other'];

const defaultEditForm = {
  questionText: '', isLatex: false,
  options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
  correctOption: 0,
  className: '', chapter: '', subject: '', medium: 'hindi', difficulty: 'medium', explanation: ''
};

export default function AdminQuestions() {
  const [activeTab, setActiveTab] = useState('all');
  const [questions, setQuestions] = useState([]);
  const [pendingQuestions, setPendingQuestions] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [filters, setFilters] = useState({ className: '', chapter: '', medium: '', status: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Edit modal
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState(defaultEditForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Reject modal
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { load(); loadPendingCount(); }, [page]);
  useEffect(() => { if (activeTab === 'pending') loadPending(); }, [activeTab]);

  const load = () => {
    setLoading(true);
    api.get('/questions/admin', { params: { ...filters, page, limit: 20 } })
      .then(res => { setQuestions(res.data.questions); setTotal(res.data.total); setTotalPages(res.data.pages); })
      .finally(() => setLoading(false));
  };

  const loadPendingCount = () => {
    api.get('/questions/pending-count').then(res => setPendingCount(res.data.count)).catch(() => {});
  };

  const loadPending = () => {
    setPendingLoading(true);
    api.get('/questions/admin', { params: { status: 'pending', limit: 50 } })
      .then(res => setPendingQuestions(res.data.questions))
      .finally(() => setPendingLoading(false));
  };

  const deleteQ = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await api.delete(`/questions/${id}`);
      setQuestions(q => q.filter(x => x._id !== id));
      toast.success('Question deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const approveQ = async (id) => {
    try {
      await api.patch(`/questions/${id}/approve`);
      toast.success('Question approved! ✅');
      loadPending();
      loadPendingCount();
      load();
    } catch { toast.error('Failed to approve'); }
  };

  const openReject = (id) => { setRejectId(id); setRejectReason(''); setRejectModal(true); };

  const confirmReject = async () => {
    if (!rejectReason.trim()) return toast.error('Please enter a reason for rejection');
    try {
      await api.patch(`/questions/${rejectId}/reject`, { reason: rejectReason });
      toast.success('Question rejected');
      setRejectModal(false);
      loadPending();
      loadPendingCount();
    } catch { toast.error('Failed to reject'); }
  };

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
    if (!editForm.className) return toast.error('Class is required');
    if (!editForm.chapter.trim()) return toast.error('Chapter is required');
    setSaving(true);
    try {
      const res = await api.put(`/questions/${editId}`, editForm);
      setQuestions(qs => qs.map(q => q._id === editId ? res.data.question : q));
      toast.success('Question updated! ✅');
      setEditModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally { setSaving(false); }
  };

  const setOptionText = (idx, value) => {
    setEditForm({ ...editForm, options: editForm.options.map((o, i) => i === idx ? { ...o, text: value } : o) });
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className="page-title">❓ Questions Bank</div>
          <div style={{ color: 'var(--text-muted)' }}>Total: {total} questions</div>
        </div>
        <Link to="/admin/upload" className="btn btn-primary">➕ Add Questions</Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: '#f0e8d8', borderRadius: '10px', padding: '4px', width: 'fit-content', marginBottom: '20px' }}>
        <div onClick={() => setActiveTab('all')} style={{ padding: '8px 18px', borderRadius: '7px', background: activeTab === 'all' ? 'var(--navy)' : 'transparent', color: activeTab === 'all' ? 'white' : 'var(--text-muted)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
          📋 All Questions
        </div>
        <div onClick={() => { setActiveTab('pending'); loadPending(); }} style={{ padding: '8px 18px', borderRadius: '7px', background: activeTab === 'pending' ? 'var(--gold)' : 'transparent', color: activeTab === 'pending' ? 'white' : 'var(--text-muted)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ⏳ Pending Approval
          {pendingCount > 0 && (
            <span style={{ background: '#e53935', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>{pendingCount}</span>
          )}
        </div>
      </div>

      {/* ── ALL QUESTIONS TAB ── */}
      {activeTab === 'all' && (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <select className="form-input form-select" style={{ maxWidth: '130px' }} value={filters.medium} onChange={e => setFilters({ ...filters, medium: e.target.value })}>
              <option value="">All Medium</option>
              <option value="hindi">हिंदी</option>
              <option value="english">English</option>
            </select>
            <input className="form-input" style={{ maxWidth: '120px' }} placeholder="Class..." value={filters.className} onChange={e => setFilters({ ...filters, className: e.target.value })} />
            <input className="form-input" style={{ maxWidth: '200px' }} placeholder="Chapter..." value={filters.chapter} onChange={e => setFilters({ ...filters, chapter: e.target.value })} />
            <select className="form-input form-select" style={{ maxWidth: '150px' }} value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All Status</option>
              <option value="approved">✅ Approved</option>
              <option value="pending">⏳ Pending</option>
              <option value="rejected">❌ Rejected</option>
            </select>
            <button className="btn btn-primary" onClick={() => { setPage(1); load(); }}>🔍 Filter</button>
            <button className="btn btn-outline" onClick={() => { setFilters({ className: '', chapter: '', medium: '', status: '' }); setPage(1); }}>Clear</button>
          </div>

          <div className="card" style={{ overflowX: 'auto' }}>
            {loading ? <div className="loading-center"><div className="spinner"></div></div> : (
              <table className="data-table">
                <thead>
                  <tr><th>#</th><th>Question</th><th>Class</th><th>Chapter</th><th>Medium</th><th>Difficulty</th><th>Status</th><th>By</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {questions.map((q, i) => (
                    <tr key={q._id}>
                      <td style={{ color: 'var(--text-muted)' }}>{(page - 1) * 20 + i + 1}</td>
                      <td style={{ maxWidth: '260px' }}>
                        <div style={{ fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {q.isLatex && <span className="badge badge-gold" style={{ marginRight: '6px', fontSize: '0.7rem' }}>LaTeX</span>}
                          {q.questionText}
                        </div>
                        {q.pendingData?.questionText && <div style={{ fontSize: '11px', color: 'var(--gold)' }}>Edit pending</div>}
                      </td>
                      <td><span className="badge badge-navy">Class {q.className}</span></td>
                      <td style={{ fontSize: '0.85rem', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.chapter}</td>
                      <td><span className="badge badge-gold">{q.medium === 'hindi' ? 'हिंदी' : 'EN'}</span></td>
                      <td><span className={`badge ${q.difficulty === 'easy' ? 'badge-success' : q.difficulty === 'hard' ? 'badge-error' : 'badge-gold'}`}>{q.difficulty}</span></td>
                      <td>
                        <span style={{
                          background: q.status === 'approved' ? '#e8f5e9' : q.status === 'pending' ? '#fff8e1' : '#ffebee',
                          color: q.status === 'approved' ? '#2e7d32' : q.status === 'pending' ? '#f57f17' : '#c62828',
                          padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600
                        }}>
                          {q.status === 'approved' ? '✅' : q.status === 'pending' ? '⏳' : '❌'} {q.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{q.createdBy?.name || 'Admin'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-sm" style={{ background: 'var(--navy)', color: 'white' }} onClick={() => openEdit(q)}>✏️</button>
                          {q.status === 'pending' && <button className="btn btn-sm" style={{ background: '#2e7d32', color: 'white' }} onClick={() => approveQ(q._id)}>✅</button>}
                          <button className="btn btn-danger btn-sm" onClick={() => deleteQ(q._id)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {questions.length === 0 && <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No questions found</td></tr>}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
            <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ padding: '8px 16px', color: 'var(--text-muted)' }}>Page {page}/{totalPages}</span>
            <button className="btn btn-outline btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        </>
      )}

      {/* ── PENDING APPROVAL TAB ── */}
      {activeTab === 'pending' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          {pendingLoading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>⏳ Loading pending questions...</div>
          ) : pendingQuestions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '8px' }}>✅</div>
              No pending questions! All caught up.
            </div>
          ) : (
            pendingQuestions.map((q, i) => (
              <div key={q._id} style={{ padding: '20px', borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'white' : '#fafaf7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>

                    {/* Is this an edit or new question? */}
                    {q.pendingData?.questionText ? (
                      <>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gold)', marginBottom: '8px', textTransform: 'uppercase' }}>
                          ✏️ Pending Edit by {q.createdBy?.name || 'Manager'}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                          <div style={{ background: '#ffebee', padding: '12px', borderRadius: '8px', border: '1px solid #ffcdd2' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#c62828', marginBottom: '6px' }}>ORIGINAL</div>
                            <div style={{ fontSize: '13px', fontWeight: 500 }}>{q.questionText}</div>
                            <div style={{ marginTop: '8px' }}>
                              {q.options?.map((o, idx) => (
                                <div key={idx} style={{ fontSize: '12px', color: idx === q.correctOption ? '#2e7d32' : 'var(--text-muted)', fontWeight: idx === q.correctOption ? 700 : 400 }}>
                                  {['A','B','C','D'][idx]}. {o.text} {idx === q.correctOption ? '✅' : ''}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div style={{ background: '#e8f5e9', padding: '12px', borderRadius: '8px', border: '1px solid #c8e6c9' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#2e7d32', marginBottom: '6px' }}>PROPOSED EDIT</div>
                            <div style={{ fontSize: '13px', fontWeight: 500 }}>{q.pendingData.questionText}</div>
                            <div style={{ marginTop: '8px' }}>
                              {q.pendingData.options?.map((o, idx) => (
                                <div key={idx} style={{ fontSize: '12px', color: idx === q.pendingData.correctOption ? '#2e7d32' : 'var(--text-muted)', fontWeight: idx === q.pendingData.correctOption ? 700 : 400 }}>
                                  {['A','B','C','D'][idx]}. {o.text} {idx === q.pendingData.correctOption ? '✅' : ''}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#f57f17', marginBottom: '6px', textTransform: 'uppercase' }}>
                          🆕 New Question by {q.createdBy?.name || 'Manager'}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy)', marginBottom: '10px' }}>{q.questionText}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                          {q.options?.map((o, idx) => (
                            <span key={idx} style={{ background: idx === q.correctOption ? '#e8f5e9' : 'var(--bg)', border: `1px solid ${idx === q.correctOption ? '#2e7d32' : 'var(--border)'}`, color: idx === q.correctOption ? '#2e7d32' : 'var(--text)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: idx === q.correctOption ? 700 : 400 }}>
                              {['A','B','C','D'][idx]}. {o.text} {idx === q.correctOption ? '✅' : ''}
                            </span>
                          ))}
                        </div>
                      </>
                    )}

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                      <span className="badge badge-navy">Class {q.className}</span>
                      <span className="badge badge-gold">{q.chapter}</span>
                      <span className={`badge ${q.difficulty === 'easy' ? 'badge-success' : q.difficulty === 'hard' ? 'badge-error' : 'badge-gold'}`}>{q.difficulty}</span>
                      <span className="badge badge-gold">{q.medium === 'hindi' ? 'हिंदी' : 'English'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button className="btn btn-sm" style={{ background: '#2e7d32', color: 'white', padding: '8px 16px' }} onClick={() => approveQ(q._id)}>
                      ✅ Approve
                    </button>
                    <button className="btn btn-sm" style={{ background: '#c62828', color: 'white', padding: '8px 16px' }} onClick={() => openReject(q._id)}>
                      ❌ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--navy)' }}>✏️ Edit Question</div>
              <button onClick={() => setEditModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Question Text *</label>
              <textarea className="form-input" rows={3} style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }}
                value={editForm.questionText} onChange={e => setEditForm({ ...editForm, questionText: e.target.value })}
                placeholder="Use $formula$ for LaTeX e.g. $CaOCl_2$" />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="isLatex" checked={editForm.isLatex}
                onChange={e => setEditForm({ ...editForm, isLatex: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              <label htmlFor="isLatex" style={{ cursor: 'pointer', fontWeight: 500 }}>Contains LaTeX formula</label>
            </div>

            <div className="form-group">
              <label className="form-label">Options * (click radio to set correct answer)</label>
              {editForm.options.map((opt, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <input type="radio" name="correctOption" checked={editForm.correctOption === idx}
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
              <div style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 600 }}>✅ Correct: Option {['A','B','C','D'][editForm.correctOption]}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Class *</label>
                <select className="form-input form-select" value={editForm.className} onChange={e => setEditForm({ ...editForm, className: e.target.value })}>
                  <option value="">Select</option>
                  {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Chapter *</label>
                <input className="form-input" value={editForm.chapter} onChange={e => setEditForm({ ...editForm, chapter: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <select className="form-input form-select" value={editForm.subject} onChange={e => setEditForm({ ...editForm, subject: e.target.value })}>
                  <option value="">Select</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Medium</label>
                <select className="form-input form-select" value={editForm.medium} onChange={e => setEditForm({ ...editForm, medium: e.target.value })}>
                  <option value="hindi">हिंदी</option>
                  <option value="english">English</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Difficulty</label>
                <select className="form-input form-select" value={editForm.difficulty} onChange={e => setEditForm({ ...editForm, difficulty: e.target.value })}>
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Explanation</label>
              <textarea className="form-input" rows={2} style={{ resize: 'vertical' }}
                value={editForm.explanation} onChange={e => setEditForm({ ...editForm, explanation: e.target.value })} />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button className="btn btn-outline btn-full" onClick={() => setEditModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-full" onClick={saveEdit} disabled={saving}>
                {saving ? '⏳ Saving...' : '✅ Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REJECT MODAL ── */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#c62828', marginBottom: '16px' }}>❌ Reject Question</div>
            <div className="form-group">
              <label className="form-label">Reason for rejection *</label>
              <textarea className="form-input" rows={3} placeholder="e.g. Incorrect answer, unclear question..."
                value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline btn-full" onClick={() => setRejectModal(false)}>Cancel</button>
              <button className="btn btn-full" style={{ background: '#c62828', color: 'white' }} onClick={confirmReject}>❌ Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}