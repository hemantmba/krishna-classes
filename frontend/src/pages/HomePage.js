import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import AdBanner from '../components/AdBanner';

export default function HomePage() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/results/history/me?limit=5').then(res => {
      setHistory(res.data.results);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const getGrade = (pct) => {
    if (pct >= 90) return { label: 'A+', color: '#2e7d32' };
    if (pct >= 80) return { label: 'A', color: '#1565c0' };
    if (pct >= 70) return { label: 'B', color: '#6a1b9a' };
    if (pct >= 60) return { label: 'C', color: '#e65100' };
    return { label: 'D', color: '#c62828' };
  };

  return (
    <div className="page">
      {/* Hero greeting */}
      <div style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, var(--deep-blue) 100%)',
        borderRadius: 'var(--radius)', padding: '32px', marginBottom: '24px', color: 'white',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{position:'absolute', right:'20px', top:'20px', fontSize:'80px', opacity:'0.1'}}>🎓</div>
        <div style={{fontSize:'1.5rem', marginBottom:'4px'}}>
          नमस्ते, <strong style={{color:'var(--gold)'}}>{user?.name}</strong>! 🙏
        </div>
        <div style={{color:'rgba(255,255,255,0.8)', marginBottom:'20px'}}>
          Class {user?.className} • {user?.language === 'hindi' ? 'हिंदी माध्यम' : 'English Medium'}
        </div>
        <Link to="/select-test" className="btn btn-primary">
          📝 Start New Test
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-value">{user?.totalScore || 0}</div>
          <div className="stat-label">Total Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{user?.totalTests || 0}</div>
          <div className="stat-label">Tests Given</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">
            {user?.totalTests > 0 ? Math.round(user.totalScore / user.totalTests) : 0}
          </div>
          <div className="stat-label">Avg Score</div>
        </div>
        <div className="stat-card">
          <Link to="/leaderboard" style={{textDecoration:'none', color:'inherit', display:'block'}}>
            <div className="stat-icon">🏆</div>
            <div className="stat-value" style={{fontSize:'1.3rem'}}>View</div>
            <div className="stat-label">Leaderboard</div>
          </Link>
        </div>
      </div>

      {/* Ad */}
      <AdBanner slot="result-page" />

      {/* Recent tests */}
      <div className="card" style={{marginTop:'8px'}}>
        <div className="card-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <span>📜 Recent Tests</span>
          <Link to="/profile" style={{color:'var(--gold-light)', fontSize:'0.85rem'}}>View All</Link>
        </div>
        <div className="card-body" style={{padding:'0'}}>
          {loading ? (
            <div className="loading-center"><div className="spinner"></div></div>
          ) : history.length === 0 ? (
            <div style={{textAlign:'center', padding:'40px', color:'var(--text-muted)'}}>
              <div style={{fontSize:'3rem', marginBottom:'12px'}}>📚</div>
              <div>No tests given yet. <Link to="/select-test" className="auth-link">Start your first test!</Link></div>
            </div>
          ) : (
            history.map(r => {
              const grade = getGrade(r.percentage);
              return (
                <Link key={r._id} to={`/result/${r._id}`} style={{textDecoration:'none'}}>
                  <div style={{
                    display:'flex', alignItems:'center', padding:'16px 20px',
                    borderBottom:'1px solid var(--border)', transition:'var(--transition)',
                    cursor:'pointer'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-pale)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width:'44px', height:'44px', borderRadius:'50%', background:grade.color,
                      color:'white', display:'flex', alignItems:'center', justifyContent:'center',
                      fontWeight:'800', fontSize:'1rem', flexShrink:0, marginRight:'16px'
                    }}>{grade.label}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:'600', fontSize:'0.95rem', color:'var(--text)'}}>
                        {r.chapter} - Class {r.className}
                      </div>
                      <div style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>
                        {r.correct}/{r.totalQuestions} correct • {r.percentage}% • {new Date(r.createdAt).toLocaleDateString('hi-IN')}
                      </div>
                    </div>
                    <div style={{fontSize:'1.2rem', fontWeight:'800', color:grade.color}}>
                      {r.percentage}%
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'16px', marginTop:'20px'}}>
        {[
          { icon:'📝', label:'Start Test', sub:'Take a chapter test', to:'/select-test', color:'var(--navy)' },
          { icon:'🏆', label:'Leaderboard', sub:'See your rank', to:'/leaderboard', color:'var(--gold-dark)' },
          { icon:'👤', label:'My Profile', sub:'View & edit profile', to:'/profile', color:'var(--deep-blue)' },
        ].map(a => (
          <Link key={a.to} to={a.to} style={{textDecoration:'none'}}>
            <div className="card" style={{padding:'20px', cursor:'pointer', transition:'var(--transition)', borderLeft:`4px solid ${a.color}`}}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={{fontSize:'2rem', marginBottom:'8px'}}>{a.icon}</div>
              <div style={{fontWeight:'700', color:'var(--text)', marginBottom:'2px'}}>{a.label}</div>
              <div style={{fontSize:'0.82rem', color:'var(--text-muted)'}}>{a.sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
