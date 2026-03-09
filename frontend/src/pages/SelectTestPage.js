import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function SelectTestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meta, setMeta] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState({
    language: user?.language || 'hindi',
    className: user?.className || '',
    subject: '',
    chapter: '',
    questionCount: 20
  });

  useEffect(() => {
    api.get(`/questions/meta?medium=${selected.language}`)
      .then(res => setMeta(res.data.data))
      .catch(() => toast.error('Failed to load test options'))
      .finally(() => setLoading(false));
  }, [selected.language]);

  const classes = [...new Set(meta.map(m => m._id.className))].sort();
  const subjects = [...new Set(meta.filter(m => m._id.className === selected.className).map(m => m._id.subject))];
  const chapters = meta.filter(m => m._id.className === selected.className && (!selected.subject || m._id.subject === selected.subject));

  const handleStart = () => {
    if (!selected.className || !selected.chapter) return toast.warning('Please select class and chapter');
    const chapterData = chapters.find(c => c._id.chapter === selected.chapter);
    if (!chapterData || chapterData.count < 5) return toast.warning('Not enough questions in this chapter');
    navigate('/test', { state: selected });
  };

  return (
    <div className="page">
      <div className="page-title">📝 Start Test</div>
      <div className="page-subtitle">Select your test options below</div>

      <div style={{maxWidth:'600px'}}>
        {/* Language */}
        <div className="card" style={{marginBottom:'20px', padding:'24px'}}>
          <div style={{fontWeight:'700', color:'var(--navy)', marginBottom:'12px', fontSize:'1rem'}}>
            🌐 Select Medium / माध्यम चुनें
          </div>
          <div className="lang-toggle" style={{width:'fit-content'}}>
            <button
              className={`lang-btn ${selected.language === 'hindi' ? 'active' : ''}`}
              onClick={() => setSelected({...selected, language:'hindi', chapter:''})}
            >🇮🇳 हिंदी</button>
            <button
              className={`lang-btn ${selected.language === 'english' ? 'active' : ''}`}
              onClick={() => setSelected({...selected, language:'english', chapter:''})}
            >🇬🇧 English</button>
          </div>
        </div>

        {/* Class */}
        <div className="card" style={{marginBottom:'20px', padding:'24px'}}>
          <div style={{fontWeight:'700', color:'var(--navy)', marginBottom:'12px'}}>
            🏫 Select Class / कक्षा चुनें
          </div>
          {loading ? <div className="spinner" style={{margin:'0 auto'}} /> : (
            <div style={{display:'flex', flexWrap:'wrap', gap:'10px'}}>
              {classes.map(c => (
                <button key={c}
                  style={{
                    padding:'10px 20px', borderRadius:'8px', border:'2px solid',
                    borderColor: selected.className === c ? 'var(--gold)' : 'var(--border)',
                    background: selected.className === c ? 'var(--gold)' : 'white',
                    color: selected.className === c ? 'white' : 'var(--text)',
                    fontWeight:'600', cursor:'pointer', transition:'var(--transition)',
                    fontFamily:'Poppins, sans-serif'
                  }}
                  onClick={() => setSelected({...selected, className:c, subject:'', chapter:''})}
                >Class {c}</button>
              ))}
              {classes.length === 0 && <div style={{color:'var(--text-muted)'}}>No classes available for this medium</div>}
            </div>
          )}
        </div>

        {/* Subject */}
        {selected.className && subjects.length > 1 && (
          <div className="card" style={{marginBottom:'20px', padding:'24px'}}>
            <div style={{fontWeight:'700', color:'var(--navy)', marginBottom:'12px'}}>📚 Select Subject</div>
            <div style={{display:'flex', flexWrap:'wrap', gap:'10px'}}>
              {subjects.map(s => (
                <button key={s} onClick={() => setSelected({...selected, subject:s, chapter:''})}
                  style={{
                    padding:'10px 20px', borderRadius:'8px', border:'2px solid',
                    borderColor: selected.subject === s ? 'var(--deep-blue)' : 'var(--border)',
                    background: selected.subject === s ? 'var(--deep-blue)' : 'white',
                    color: selected.subject === s ? 'white' : 'var(--text)',
                    fontWeight:'600', cursor:'pointer', fontFamily:'Poppins, sans-serif'
                  }}
                >{s}</button>
              ))}
            </div>
          </div>
        )}

        {/* Chapter */}
        {selected.className && (
          <div className="card" style={{marginBottom:'20px', padding:'24px'}}>
            <div style={{fontWeight:'700', color:'var(--navy)', marginBottom:'12px'}}>📖 Select Chapter</div>
            <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
              {chapters.map(c => (
                <div key={c._id.chapter}
                  onClick={() => setSelected({...selected, chapter:c._id.chapter})}
                  style={{
                    padding:'14px 16px', borderRadius:'8px', border:'2px solid',
                    borderColor: selected.chapter === c._id.chapter ? 'var(--gold)' : 'var(--border)',
                    background: selected.chapter === c._id.chapter ? 'var(--gold-pale)' : 'white',
                    cursor:'pointer', transition:'var(--transition)',
                    display:'flex', justifyContent:'space-between', alignItems:'center'
                  }}
                >
                  <span style={{fontWeight:'500'}}>{c._id.chapter}</span>
                  <span style={{
                    background: 'var(--navy)', color:'white', padding:'2px 10px',
                    borderRadius:'12px', fontSize:'0.75rem', fontWeight:'600'
                  }}>{c.count} Qs</span>
                </div>
              ))}
              {chapters.length === 0 && <div style={{color:'var(--text-muted)'}}>Select a class to see chapters</div>}
            </div>
          </div>
        )}

        {/* Question count */}
        {selected.chapter && (
          <div className="card" style={{marginBottom:'20px', padding:'24px'}}>
            <div style={{fontWeight:'700', color:'var(--navy)', marginBottom:'12px'}}>🔢 Number of Questions</div>
            <div style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
              {[10, 20, 30, 50].map(n => (
                <button key={n}
                  onClick={() => setSelected({...selected, questionCount:n})}
                  style={{
                    padding:'10px 24px', borderRadius:'8px', border:'2px solid',
                    borderColor: selected.questionCount === n ? 'var(--gold)' : 'var(--border)',
                    background: selected.questionCount === n ? 'var(--gold)' : 'white',
                    color: selected.questionCount === n ? 'white' : 'var(--text)',
                    fontWeight:'600', cursor:'pointer', fontFamily:'Poppins, sans-serif'
                  }}
                >{n}</button>
              ))}
            </div>
          </div>
        )}

        {selected.chapter && (
          <button className="btn btn-primary btn-full" style={{fontSize:'1.1rem', padding:'16px'}} onClick={handleStart}>
            🚀 Start Test Now
          </button>
        )}
      </div>
    </div>
  );
}
