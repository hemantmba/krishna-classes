import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset link sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{fontSize:'2.5rem', marginBottom:'8px'}}>🔐</div>
          <div className="auth-title">Forgot Password</div>
          <div className="auth-subtitle">Enter your email to receive a reset link</div>
        </div>

        {sent ? (
          <div style={{textAlign:'center', padding:'20px'}}>
            <div style={{fontSize:'3rem', marginBottom:'12px'}}>📧</div>
            <div style={{fontWeight:'600', color:'var(--success)', marginBottom:'8px'}}>Email Sent!</div>
            <div style={{color:'var(--text-muted)', fontSize:'0.9rem', marginBottom:'20px'}}>
              Check your inbox for the password reset link. The link is valid for 1 hour.
            </div>
            <Link to="/login" className="btn btn-primary btn-full">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">📧 Email Address</label>
              <input className="form-input" type="email" placeholder="your@email.com"
                value={email} onChange={e=>setEmail(e.target.value)} required />
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? '⏳ Sending...' : '📧 Send Reset Link'}
            </button>
          </form>
        )}

        <div style={{textAlign:'center', marginTop:'16px', fontSize:'0.88rem'}}>
          <Link to="/login" className="auth-link">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

export function ResetPassword() {
  const { token } = require('react-router-dom').useParams();
  const navigate = require('react-router-dom').useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      toast.success('Password reset successful!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset failed. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{fontSize:'2.5rem', marginBottom:'8px'}}>🔑</div>
          <div className="auth-title">Reset Password</div>
          <div className="auth-subtitle">Enter your new password</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="form-input" type="password" placeholder="Min 6 characters" minLength={6}
              value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input className="form-input" type="password" placeholder="Repeat password"
              value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})} required />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? '⏳ Resetting...' : '✅ Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
