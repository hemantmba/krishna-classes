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
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ className: '', chapter: '', medium: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Edit modal state
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState(defaultEditForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/questions/admin', { params: { ...filters, page, limit: 20 } })
      .then(res => {
        setQuestions(res.data.questions);
        setTotal(res.data.total);
        setTotalPages(res.data.pages);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page]);

  const deleteQ = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await api.delete(`/questions/${id}`);
      setQuestions(q => q.filter(x => x._id !== id));
      toast.success('Question deleted');
    } catch { toast.error('Failed to delete'); }
  };

  // Open edit modal and populate form
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

  const closeEdit = () => {
    setEditModal(false);
    setEditId(null);
    setEditForm(defaultEditForm);
  };

  // Save edited question
  const saveEdit = async () => {
    if (!editForm.questionText.trim()) return toast.error('Question text is required');
    if (editForm.options.some(o => !o.text.trim())) return toast.error('All 4 options are required');
    if (!editForm.className) return toast.error('Class is required');
    if (!editForm.chapter.trim()) return toast.error('Chapter is required');

    setSaving(true);
    try {
      const res = await api.put(`/questions/${editId}`, editForm);
      // Update in list
      setQuestions(qs => qs.map(q => q._id === editId ? res.data.question : q));
      toast.success('Question updated successfully!');
      closeEdit();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update question');
    } finally {
      setSaving(false);
    }
  };

  // Update single option text
  const setOptionText = (idx, value) => {
    const updated = editForm.options.map((o, i) => i === idx ? { ...o, text: value } : o);
    setEditForm({ ...editForm, options: updated });
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

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <select className="form-input form-select" style={{ maxWidth: '130px' }} value={filters.medium} onChange={e => setFilters({ ...filters, medium: e.target.value })}>
          <option value="">All Medium</option>
          <option value="hindi">हिंदी</option>
          <option value="english">English</option>
        </select>
        <input className="form-input" style={{ maxWidth: '120px' }} placeholder="Class..." value={filters.className} onChange={e => setFilters({ ...filters, className: e.target.value })} />
        <input className="form-input" style={{ maxWidth: '200px' }} placeholder="Chapter..." value={filters.chapter} onChange={e => setFilters({ ...filters, chapter: e.target.value })} />
        <button className="btn btn-primary" onClick={() => { setPage(1); load(); }}>🔍 Filter</button>
        <button className="btn btn-outline" onClick={() => { setFilters({ className: '', chapter: '', medium: '' }); setPage(1); }}>Clear</button>
      </div>

      {/* Questions Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? <div className="loading-center"><div className="spinner"></div></div> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Question</th>
                <th>Class</th>
                <th>Chapter</th>
                <th>Medium</th>
                <th>Difficulty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, i) => (
                <tr key={q._id}>
                  <td style={{ color: 'var(--text-muted)' }}>{(page - 1) * 20 + i + 1}</td>
                  <td style={{ maxWidth: '280px' }}>
                    <div style={{ fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {q.isLatex && <span className="badge badge-gold" style={{ marginRight: '6px', fontSize: '0.7rem' }}>LaTeX</span>}
                      {q.questionText}
                    </div>
                  </td>
                  <td><span className="badge badge-navy">Class {q.className}</span></td>
                  <td style={{ fontSize: '0.85rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.chapter}</td>
                  <td><span className="badge badge-gold">{q.medium === 'hindi' ? 'हिंदी' : 'EN'}</span></td>
                  <td>
                    <span className={`badge ${q.difficulty === 'easy' ? 'badge-success' : q.difficulty === 'hard' ? 'badge-error' : 'badge-gold'}`}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-sm" style={{ background: 'var(--navy)', color: 'white' }} onClick={() => openEdit(q)}>
                        ✏️ Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteQ(q._id)}>
                        🗑 Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {questions.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No questions found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
        <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
        <span style={{ padding: '8px 16px', color: 'var(--text-muted)' }}>Page {page}/{totalPages}</span>
        <button className="btn btn-outline btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
      </div>

      {/* ===== EDIT MODAL ===== */}
      {editModal && (
        <div className="modal-overlay" onClick={closeEdit}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--navy)' }}>✏️ Edit Question</div>
              <button onClick={closeEdit} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            {/* Question Text */}
            <div className="form-group">
              <label className="form-label">Question Text *</label>
              <textarea
                className="form-input"
                rows={3}
                style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }}
                value={editForm.questionText}
                onChange={e => setEditForm({ ...editForm, questionText: e.target.value })}
                placeholder="Use $formula$ for LaTeX e.g. $CaOCl_2$"
              />
            </div>

            {/* isLatex toggle */}
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="isLatex"
                checked={editForm.isLatex}
                onChange={e => setEditForm({ ...editForm, isLatex: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="isLatex" style={{ cursor: 'pointer', fontWeight: 500 }}>
                Contains LaTeX formula ($...$)
              </label>
            </div>

            {/* Options */}
            <div className="form-group">
              <label className="form-label">Options * (click radio to set correct answer)</label>
              {editForm.options.map((opt, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <input
                    type="radio"
                    name="correctOption"
                    checked={editForm.correctOption === idx}
                    onChange={() => setEditForm({ ...editForm, correctOption: idx })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 }}
                  />
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    background: editForm.correctOption === idx ? 'var(--gold)' : 'var(--navy)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '13px'
                  }}>
                    {['A', 'B', 'C', 'D'][idx]}
                  </div>
                  <input
                    className="form-input"
                    style={{ flex: 1, border: editForm.correctOption === idx ? '2px solid var(--gold)' : undefined }}
                    placeholder={`Option ${['A', 'B', 'C', 'D'][idx]}`}
                    value={opt.text}
                    onChange={e => setOptionText(idx, e.target.value)}
                  />
                </div>
              ))}
              <div style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 600 }}>
                ✅ Correct Answer: Option {['A', 'B', 'C', 'D'][editForm.correctOption]}
              </div>
            </div>

            {/* Class, Chapter, Subject */}
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
                <input className="form-input" placeholder="Chapter name" value={editForm.chapter} onChange={e => setEditForm({ ...editForm, chapter: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <select className="form-input form-select" value={editForm.subject} onChange={e => setEditForm({ ...editForm, subject: e.target.value })}>
                  <option value="">Select</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Medium, Difficulty */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Medium</label>
                <select className="form-input form-select" value={editForm.medium} onChange={e => setEditForm({ ...editForm, medium: e.target.value })}>
                  <option value="hindi">हिंदी (Hindi)</option>
                  <option value="english">English</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Difficulty</label>
                <select className="form-input form-select" value={editForm.difficulty} onChange={e => setEditForm({ ...editForm, difficulty: e.target.value })}>
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
              </div>
            </div>

            {/* Explanation */}
            <div className="form-group">
              <label className="form-label">Explanation (optional)</label>
              <textarea
                className="form-input"
                rows={2}
                style={{ resize: 'vertical' }}
                placeholder="Explain the correct answer..."
                value={editForm.explanation}
                onChange={e => setEditForm({ ...editForm, explanation: e.target.value })}
              />
            </div>

            {/* Modal Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button className="btn btn-outline btn-full" onClick={closeEdit}>Cancel</button>
              <button className="btn btn-primary btn-full" onClick={saveEdit} disabled={saving}>
                {saving ? '⏳ Saving...' : '✅ Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}