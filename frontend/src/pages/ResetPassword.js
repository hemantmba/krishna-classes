import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      toast.success('Password reset successful! Please login.');
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
          <div className="auth-subtitle">Enter your new password below</div>
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
        <div style={{textAlign:'center', marginTop:'16px'}}>
          <Link to="/login" className="auth-link">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
