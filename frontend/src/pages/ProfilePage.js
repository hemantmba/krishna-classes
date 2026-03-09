import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword:'', newPassword:'', confirm:'' });
  const [langForm, setLangForm] = useState(user?.language || 'hindi');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (tab === 'history') {
      setLoading(true);
      api.get(`/results/history/me?page=${page}&limit=10`).then(res => {
        setHistory(res.data.results);
        setTotalPages(res.data.pages);
      }).finally(() => setLoading(false));
    }
  }, [tab, page]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords do not match');
    try {
      await api.post('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword:'', newPassword:'', confirm:'' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    }
  };

  const handleLanguageChange = async () => {
    try {
      await api.patch('/user/language', { language: langForm });
      updateUser({ language: langForm });
      toast.success('Language preference updated!');
    } catch (err) {
      toast.error('Failed to update language');
    }
  };

  return (
    <div className="page">
      <div className="page-title">👤 My Profile</div>

      <div className="tabs">
        <button className={`tab ${tab==='profile'?'active':''}`} onClick={()=>setTab('profile')}>Profile</button>
        <button className={`tab ${tab==='password'?'active':''}`} onClick={()=>setTab('password')}>Change Password</button>
        <button className={`tab ${tab==='history'?'active':''}`} onClick={()=>setTab('history')}>Test History</button>
      </div>

      {tab === 'profile' && (
        <div style={{maxWidth:'500px'}}>
          <div className="card" style={{padding:'28px', marginBottom:'20px'}}>
            <div style={{textAlign:'center', marginBottom:'24px'}}>
              <div style={{width:'80px',height:'80px',borderRadius:'50%',background:'linear-gradient(135deg,var(--navy),var(--gold))',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',fontSize:'2.5rem'}}>🎓</div>
              <div style={{fontSize:'1.3rem', fontWeight:'700', color:'var(--navy)'}}>{user?.name}</div>
              <div style={{color:'var(--text-muted)', fontSize:'0.88rem'}}>{user?.email}</div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
              {[
                {label:'Father\'s Name', value: user?.fatherName},
                {label:'Class', value: `Class ${user?.className}`},
                {label:'Medium', value: user?.language === 'hindi' ? 'हिंदी' : 'English'},
                {label:'Total Score', value: user?.totalScore || 0},
                {label:'Tests Given', value: user?.totalTests || 0},
                {label:'Avg Score', value: user?.totalTests > 0 ? Math.round(user.totalScore / user.totalTests) : 0},
              ].map(({label,value}) => (
                <div key={label} style={{padding:'12px', background:'var(--bg)', borderRadius:'8px'}}>
                  <div style={{fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'4px'}}>{label}</div>
                  <div style={{fontWeight:'700', color:'var(--navy)'}}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{padding:'24px'}}>
            <div style={{fontWeight:'700', color:'var(--navy)', marginBottom:'16px'}}>🌐 Language Preference</div>
            <div className="lang-toggle" style={{marginBottom:'16px'}}>
              <button className={`lang-btn ${langForm==='hindi'?'active':''}`} onClick={()=>setLangForm('hindi')}>🇮🇳 हिंदी</button>
              <button className={`lang-btn ${langForm==='english'?'active':''}`} onClick={()=>setLangForm('english')}>🇬🇧 English</button>
            </div>
            <button className="btn btn-primary" onClick={handleLanguageChange}>Save Preference</button>
          </div>
        </div>
      )}

      {tab === 'password' && (
        <div style={{maxWidth:'400px'}}>
          <div className="card" style={{padding:'28px'}}>
            <div style={{fontSize:'1.2rem', fontWeight:'700', color:'var(--navy)', marginBottom:'20px'}}>🔐 Change Password</div>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input className="form-input" type="password" value={pwForm.currentPassword}
                  onChange={e=>setPwForm({...pwForm,currentPassword:e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input className="form-input" type="password" value={pwForm.newPassword}
                  onChange={e=>setPwForm({...pwForm,newPassword:e.target.value})} required minLength={6} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input className="form-input" type="password" value={pwForm.confirm}
                  onChange={e=>setPwForm({...pwForm,confirm:e.target.value})} required />
              </div>
              <button className="btn btn-primary btn-full" type="submit">Update Password</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div>
          {loading ? <div className="loading-center"><div className="spinner"></div></div> : (
            <>
              {history.length === 0 ? (
                <div style={{textAlign:'center', padding:'40px', color:'var(--text-muted)'}}>
                  No tests taken yet. <Link to="/select-test" className="auth-link">Start now!</Link>
                </div>
              ) : (
                <div>
                  {history.map(r => (
                    <Link key={r._id} to={`/result/${r._id}`} style={{textDecoration:'none'}}>
                      <div className="card" style={{padding:'16px 20px', marginBottom:'12px', display:'flex', alignItems:'center', gap:'16px', cursor:'pointer', transition:'var(--transition)'}}
                        onMouseEnter={e=>e.currentTarget.style.transform='translateX(4px)'}
                        onMouseLeave={e=>e.currentTarget.style.transform='none'}>
                        <div style={{
                          width:'48px',height:'48px',borderRadius:'50%',
                          background: r.percentage >= 60 ? 'var(--success)' : 'var(--error)',
                          color:'white',display:'flex',alignItems:'center',justifyContent:'center',
                          fontWeight:'800', fontSize:'0.9rem', flexShrink:0
                        }}>{r.percentage}%</div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:'600'}}>{r.chapter} - Class {r.className}</div>
                          <div style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>
                            ✅ {r.correct} ❌ {r.wrong} ⏭ {r.skipped} • {new Date(r.createdAt).toLocaleDateString('hi-IN')}
                          </div>
                        </div>
                        <div>
                          <span className={`badge ${r.percentage >= 60 ? 'badge-success' : 'badge-error'}`}>
                            {r.score}/{r.maxScore}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                  <div style={{display:'flex', justifyContent:'center', gap:'12px', marginTop:'16px'}}>
                    <button className="btn btn-outline btn-sm" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
                    <span style={{padding:'8px 16px', color:'var(--text-muted)'}}>Page {page}/{totalPages}</span>
                    <button className="btn btn-outline btn-sm" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>Next →</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
