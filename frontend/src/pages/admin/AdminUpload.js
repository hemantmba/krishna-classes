import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const CLASSES = ['1','2','3','4','5','6','7','8','9','10','11','12','BA','BSC','BCOM'];

const emptyOption = { text: '', isLatex: false };

export default function AdminUpload() {
  const [tab, setTab] = useState('single');

  // Single question form
  const [form, setForm] = useState({
    questionText: '', isLatex: false, medium: 'hindi', className: '', chapter: '', subject: '',
    correctOption: 0, explanation: '', difficulty: 'medium',
    options: [{ ...emptyOption }, { ...emptyOption }, { ...emptyOption }, { ...emptyOption }]
  });
  const [questionImage, setQuestionImage] = useState(null);
  const [optionImages, setOptionImages] = useState([null, null, null, null]);
  const [loading, setLoading] = useState(false);

  // Bulk upload
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkMeta, setBulkMeta] = useState({ medium:'hindi', className:'', chapter:'', subject:'' });
  const [bulkLoading, setBulkLoading] = useState(false);

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (form.options.some(o => !o.text.trim())) return toast.error('All 4 options are required');
    setLoading(true);
    try {
      const fd = new FormData();
      const { options, ...rest } = form;
      Object.entries(rest).forEach(([k,v]) => fd.append(k, v));
      fd.append('options', JSON.stringify(options));
      if (questionImage) fd.append('questionImage', questionImage);
      optionImages.forEach((img, i) => { if (img) fd.append(`option${i}Image`, img); });

      await api.post('/questions', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Question added successfully! ✅');
      setForm({ questionText:'', isLatex:false, medium:'hindi', className:'', chapter:'', subject:'', correctOption:0, explanation:'', difficulty:'medium', options:[{...emptyOption},{...emptyOption},{...emptyOption},{...emptyOption}] });
      setQuestionImage(null);
      setOptionImages([null,null,null,null]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add question');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!bulkFile) return toast.error('Please select a CSV or XLSX file');
    setBulkLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', bulkFile);
      Object.entries(bulkMeta).forEach(([k,v]) => fd.append(k, v));
      const res = await api.post('/questions/bulk', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(res.data.message);
      setBulkFile(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bulk upload failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const updateOption = (i, field, val) => {
    const opts = [...form.options];
    opts[i] = { ...opts[i], [field]: val };
    setForm({ ...form, options: opts });
  };

  return (
    <div className="page">
      <div className="page-title">📤 Upload Questions</div>

      <div className="tabs">
        <button className={`tab ${tab==='single'?'active':''}`} onClick={()=>setTab('single')}>➕ Single Question</button>
        <button className={`tab ${tab==='bulk'?'active':''}`} onClick={()=>setTab('bulk')}>📂 Bulk Upload (CSV/XLSX)</button>
      </div>

      {tab === 'single' && (
        <form onSubmit={handleSingleSubmit} style={{maxWidth:'700px'}}>
          <div className="card" style={{padding:'24px', marginBottom:'20px'}}>
            <div style={{fontWeight:'700', color:'var(--navy)', marginBottom:'16px', fontSize:'1rem'}}>📋 Question Details</div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', marginBottom:'16px'}}>
              <div className="form-group" style={{marginBottom:'0'}}>
                <label className="form-label">Medium *</label>
                <select className="form-input form-select" value={form.medium} onChange={e=>setForm({...form,medium:e.target.value})} required>
                  <option value="hindi">हिंदी</option>
                  <option value="english">English</option>
                </select>
              </div>
              <div className="form-group" style={{marginBottom:'0'}}>
                <label className="form-label">Class *</label>
                <select className="form-input form-select" value={form.className} onChange={e=>setForm({...form,className:e.target.value})} required>
                  <option value="">Select</option>
                  {CLASSES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group" style={{marginBottom:'0'}}>
                <label className="form-label">Difficulty</label>
                <select className="form-input form-select" value={form.difficulty} onChange={e=>setForm({...form,difficulty:e.target.value})}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px'}}>
              <div className="form-group" style={{marginBottom:'0'}}>
                <label className="form-label">Subject *</label>
                <input className="form-input" placeholder="e.g. Mathematics, Science" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} required />
              </div>
              <div className="form-group" style={{marginBottom:'0'}}>
                <label className="form-label">Chapter *</label>
                <input className="form-input" placeholder="e.g. Chapter 1 - Integers" value={form.chapter} onChange={e=>setForm({...form,chapter:e.target.value})} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{display:'flex', justifyContent:'space-between'}}>
                Question Text *
                <label style={{fontWeight:'normal', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:'6px', cursor:'pointer'}}>
                  <input type="checkbox" checked={form.isLatex} onChange={e=>setForm({...form,isLatex:e.target.checked})} />
                  LaTeX format
                </label>
              </label>
              <textarea className="form-input" rows={3} placeholder={form.isLatex ? "Enter LaTeX: $x^2 + y^2 = z^2$" : "Enter question text here..."} value={form.questionText} onChange={e=>setForm({...form,questionText:e.target.value})} required style={{resize:'vertical'}} />
            </div>

            <div className="form-group">
              <label className="form-label">Question Image (optional)</label>
              <input type="file" className="form-input" accept="image/*" onChange={e=>setQuestionImage(e.target.files[0])} />
            </div>
          </div>

          <div className="card" style={{padding:'24px', marginBottom:'20px'}}>
            <div style={{fontWeight:'700', color:'var(--navy)', marginBottom:'16px'}}>🔤 Options (A-D)</div>
            {form.options.map((opt, i) => (
              <div key={i} style={{marginBottom:'16px', padding:'16px', background:'var(--bg)', borderRadius:'8px', border:`2px solid ${form.correctOption===i ? 'var(--success)' : 'var(--border)'}`}}>
                <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px'}}>
                  <div style={{width:'32px',height:'32px',borderRadius:'50%',background:form.correctOption===i?'var(--success)':'var(--navy)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700',flexShrink:0}}>
                    {['A','B','C','D'][i]}
                  </div>
                  <input className="form-input" style={{marginBottom:'0'}} placeholder={`Option ${['A','B','C','D'][i]} text`}
                    value={opt.text} onChange={e=>updateOption(i,'text',e.target.value)} required />
                  <label style={{display:'flex', alignItems:'center', gap:'6px', cursor:'pointer', flexShrink:0, fontSize:'0.85rem'}}>
                    <input type="radio" name="correct" checked={form.correctOption===i} onChange={()=>setForm({...form,correctOption:i})} />
                    ✅ Correct
                  </label>
                </div>
                <input type="file" accept="image/*" className="form-input" style={{fontSize:'0.82rem'}}
                  onChange={e=>{const imgs=[...optionImages];imgs[i]=e.target.files[0];setOptionImages(imgs);}} />
              </div>
            ))}
          </div>

          <div className="card" style={{padding:'24px', marginBottom:'20px'}}>
            <div className="form-group">
              <label className="form-label">💡 Explanation (optional)</label>
              <textarea className="form-input" rows={2} placeholder="Explanation for the correct answer..." value={form.explanation} onChange={e=>setForm({...form,explanation:e.target.value})} style={{resize:'vertical'}} />
            </div>
          </div>

          <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{fontSize:'1.05rem', padding:'16px'}}>
            {loading ? '⏳ Adding Question...' : '✅ Add Question'}
          </button>
        </form>
      )}

      {tab === 'bulk' && (
        <div style={{maxWidth:'600px'}}>
          {/* Template download info */}
          <div className="card" style={{padding:'24px', marginBottom:'20px', borderLeft:'4px solid var(--gold)'}}>
            <div style={{fontWeight:'700', color:'var(--navy)', marginBottom:'12px'}}>📋 CSV/XLSX Format</div>
            <div style={{fontSize:'0.88rem', color:'var(--text-muted)', marginBottom:'8px'}}>Your file must have these columns:</div>
            <div style={{background:'var(--bg)', padding:'12px', borderRadius:'8px', fontFamily:'monospace', fontSize:'0.82rem', overflowX:'auto'}}>
              question, optionA, optionB, optionC, optionD, answer (A/B/C/D), explanation, difficulty, isLatex
            </div>
            <div style={{marginTop:'8px', fontSize:'0.82rem', color:'var(--text-muted)'}}>
              Optional per-row: className, chapter, subject, medium (overrides defaults below)
            </div>
          </div>

          <form onSubmit={handleBulkSubmit}>
            <div className="card" style={{padding:'24px', marginBottom:'20px'}}>
              <div style={{fontWeight:'700', color:'var(--navy)', marginBottom:'16px'}}>⚙️ Default Settings</div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
                <div className="form-group" style={{marginBottom:'0'}}>
                  <label className="form-label">Medium *</label>
                  <select className="form-input form-select" value={bulkMeta.medium} onChange={e=>setBulkMeta({...bulkMeta,medium:e.target.value})}>
                    <option value="hindi">हिंदी</option>
                    <option value="english">English</option>
                  </select>
                </div>
                <div className="form-group" style={{marginBottom:'0'}}>
                  <label className="form-label">Class *</label>
                  <select className="form-input form-select" value={bulkMeta.className} onChange={e=>setBulkMeta({...bulkMeta,className:e.target.value})} required>
                    <option value="">Select</option>
                    {CLASSES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{marginBottom:'0'}}>
                  <label className="form-label">Subject *</label>
                  <input className="form-input" placeholder="e.g. Mathematics" value={bulkMeta.subject} onChange={e=>setBulkMeta({...bulkMeta,subject:e.target.value})} required />
                </div>
                <div className="form-group" style={{marginBottom:'0'}}>
                  <label className="form-label">Chapter *</label>
                  <input className="form-input" placeholder="e.g. Chapter 1" value={bulkMeta.chapter} onChange={e=>setBulkMeta({...bulkMeta,chapter:e.target.value})} required />
                </div>
              </div>
            </div>

            <div className="card" style={{padding:'24px', marginBottom:'20px'}}>
              <div className="form-group">
                <label className="form-label">📂 Select CSV or XLSX File</label>
                <input type="file" className="form-input" accept=".csv,.xlsx,.xls"
                  onChange={e=>setBulkFile(e.target.files[0])} required />
                {bulkFile && <div style={{marginTop:'8px', color:'var(--success)', fontSize:'0.85rem'}}>✅ {bulkFile.name} selected</div>}
              </div>
            </div>

            <button className="btn btn-primary btn-full" type="submit" disabled={bulkLoading} style={{fontSize:'1.05rem', padding:'16px'}}>
              {bulkLoading ? '⏳ Uploading...' : '📤 Upload Questions'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
