import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';

export default function ShareResult() {
  const { token } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/results/share/${token}`).then(res => setResult(res.data.result))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="loading-center" style={{minHeight:'100vh'}}><div className="spinner"></div></div>;
  if (!result) return <div style={{textAlign:'center', padding:'60px', color:'var(--error)'}}>Result not found</div>;

  const getGrade = p => p >= 90 ? '🥇' : p >= 75 ? '🥈' : p >= 60 ? '🏅' : '📊';

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, var(--navy), var(--deep-blue))', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'}}>
      <div style={{background:'white', borderRadius:'24px', padding:'40px', maxWidth:'480px', width:'100%', textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.4)'}}>
        <div style={{fontSize:'3rem', marginBottom:'12px'}}>🎓 Krishna Classes</div>
        <div style={{color:'var(--text-muted)', fontSize:'0.9rem', marginBottom:'24px'}}>Keep You Step Ahead</div>

        <div style={{width:'120px', height:'120px', borderRadius:'50%', background:'linear-gradient(135deg, var(--navy), var(--gold))', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', margin:'0 auto 20px'}}>
          <div style={{fontSize:'2rem', fontWeight:'800', color:'white', fontFamily:'Baloo 2'}}>{result.percentage}%</div>
          <div style={{fontSize:'2rem'}}>{getGrade(result.percentage)}</div>
        </div>

        <div style={{fontSize:'1.2rem', fontWeight:'700', color:'var(--navy)', marginBottom:'4px'}}>{result.userId?.name}</div>
        <div style={{color:'var(--text-muted)', marginBottom:'20px'}}>Class {result.className} • {result.chapter}</div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'24px'}}>
          {[
            {label:'✅ Correct', val:result.correct, color:'var(--success)'},
            {label:'❌ Wrong', val:result.wrong, color:'var(--error)'},
            {label:'⭐ Score', val:`${result.score}/${result.maxScore}`, color:'var(--gold)'},
          ].map(s => (
            <div key={s.label} style={{padding:'12px', background:'var(--bg)', borderRadius:'8px'}}>
              <div style={{fontSize:'1.3rem', fontWeight:'800', color:s.color}}>{s.val}</div>
              <div style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>{s.label}</div>
            </div>
          ))}
        </div>

        <Link to="/register" className="btn btn-primary btn-full" style={{marginBottom:'12px', fontSize:'0.95rem'}}>
          🚀 Join Krishna Classes - Start Learning!
        </Link>
        <Link to="/login" style={{display:'block', color:'var(--text-muted)', fontSize:'0.85rem'}}>
          Already a member? Login
        </Link>
      </div>
    </div>
  );
}
