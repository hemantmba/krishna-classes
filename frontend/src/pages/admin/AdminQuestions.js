import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function AdminQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ className:'', chapter:'', medium:'' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const load = () => {
    setLoading(true);
    api.get('/questions/admin', { params: { ...filters, page, limit: 20 } })
      .then(res => { setQuestions(res.data.questions); setTotal(res.data.total); setTotalPages(res.data.pages); })
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

  return (
    <div className="page">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px', flexWrap:'wrap', gap:'12px'}}>
        <div>
          <div className="page-title">❓ Questions Bank</div>
          <div style={{color:'var(--text-muted)'}}>Total: {total} questions</div>
        </div>
        <Link to="/admin/upload" className="btn btn-primary">➕ Add Questions</Link>
      </div>

      {/* Filters */}
      <div style={{display:'flex', gap:'12px', marginBottom:'20px', flexWrap:'wrap'}}>
        <select className="form-input form-select" style={{maxWidth:'120px'}} value={filters.medium} onChange={e=>setFilters({...filters,medium:e.target.value})}>
          <option value="">All Medium</option>
          <option value="hindi">हिंदी</option>
          <option value="english">English</option>
        </select>
        <input className="form-input" style={{maxWidth:'120px'}} placeholder="Class..." value={filters.className} onChange={e=>setFilters({...filters,className:e.target.value})} />
        <input className="form-input" style={{maxWidth:'200px'}} placeholder="Chapter..." value={filters.chapter} onChange={e=>setFilters({...filters,chapter:e.target.value})} />
        <button className="btn btn-primary" onClick={()=>{setPage(1);load();}}>🔍 Filter</button>
        <button className="btn btn-outline" onClick={()=>{setFilters({className:'',chapter:'',medium:''});setPage(1);}}>Clear</button>
      </div>

      <div className="card" style={{overflowX:'auto'}}>
        {loading ? <div className="loading-center"><div className="spinner"></div></div> : (
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Question</th><th>Class</th><th>Chapter</th><th>Medium</th><th>Difficulty</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {questions.map((q, i) => (
                <tr key={q._id}>
                  <td style={{color:'var(--text-muted)'}}>{(page-1)*20+i+1}</td>
                  <td style={{maxWidth:'280px'}}>
                    <div style={{fontWeight:'500', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                      {q.isLatex && <span className="badge badge-gold" style={{marginRight:'6px', fontSize:'0.7rem'}}>LaTeX</span>}
                      {q.questionText}
                    </div>
                  </td>
                  <td><span className="badge badge-navy">Class {q.className}</span></td>
                  <td style={{fontSize:'0.85rem', maxWidth:'150px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{q.chapter}</td>
                  <td><span className="badge badge-gold">{q.medium === 'hindi' ? 'हिंदी' : 'EN'}</span></td>
                  <td>
                    <span className={`badge ${q.difficulty==='easy'?'badge-success':q.difficulty==='hard'?'badge-error':'badge-gold'}`}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={()=>deleteQ(q._id)}>🗑 Delete</button>
                  </td>
                </tr>
              ))}
              {questions.length === 0 && <tr><td colSpan="7" style={{textAlign:'center', padding:'40px', color:'var(--text-muted)'}}>No questions found</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      <div style={{display:'flex', justifyContent:'center', gap:'12px', marginTop:'16px'}}>
        <button className="btn btn-outline btn-sm" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
        <span style={{padding:'8px 16px', color:'var(--text-muted)'}}>Page {page}/{totalPages}</span>
        <button className="btn btn-outline btn-sm" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>Next →</button>
      </div>
    </div>
  );
}
