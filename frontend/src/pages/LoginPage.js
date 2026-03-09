import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success(`स्वागत है, ${data.user.name}! 🎓`);
      navigate(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{fontSize:'3rem', marginBottom:'8px'}}>🎓</div>
          <div className="auth-title">Krishna Classes</div>
          <div className="auth-subtitle">Keep You Step Ahead</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">📧 Email Address</label>
            <input
              className="form-input"
              type="email" placeholder="your@email.com"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">🔒 Password</label>
            <input
              className="form-input"
              type="password" placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              required
            />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? '⏳ Logging in...' : '🚀 Login'}
          </button>
        </form>

        <div style={{textAlign:'center', marginTop:'16px', fontSize:'0.88rem', color:'var(--text-muted)'}}>
          <Link to="/forgot-password" className="auth-link">Forgot Password?</Link>
        </div>
        <div style={{textAlign:'center', marginTop:'12px', fontSize:'0.88rem', color:'var(--text-muted)'}}>
          New student?{' '}
          <Link to="/register" className="auth-link">Register here</Link>
        </div>

        <div style={{marginTop:'24px', padding:'16px', background:'var(--bg)', borderRadius:'8px', fontSize:'0.8rem', color:'var(--text-muted)', textAlign:'center'}}>
          🏆 Join thousands of students excelling with Krishna Classes
        </div>
      </div>
    </div>
  );
}
