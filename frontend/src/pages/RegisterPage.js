import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const CLASSES = ['1','2','3','4','5','6','7','8','9','10','11','12','BA','BSC','BCOM','Other'];

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '', fatherName: '', className: '', email: '', password: '', confirm: '', language: 'hindi'
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const { confirm, ...data } = form;
      await register(data);
      toast.success('Registration successful! Welcome to Krishna Classes 🎓');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const f = (field) => ({ value: form[field], onChange: e => setForm({...form, [field]: e.target.value}) });

  return (
    <div className="auth-page">
      <div className="auth-card" style={{maxWidth:'520px'}}>
        <div className="auth-logo">
          <div style={{fontSize:'2.5rem', marginBottom:'4px'}}>🎓</div>
          <div className="auth-title">Create Account</div>
          <div className="auth-subtitle">Join Krishna Classes Today</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" placeholder="Your name" required {...f('name')} />
            </div>
            <div className="form-group">
              <label className="form-label">Father's Name *</label>
              <input className="form-input" placeholder="Father's name" required {...f('fatherName')} />
            </div>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
            <div className="form-group">
              <label className="form-label">Class *</label>
              <select className="form-input form-select" required {...f('className')}>
                <option value="">Select Class</option>
                {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Language *</label>
              <select className="form-input form-select" required {...f('language')}>
                <option value="hindi">हिंदी (Hindi)</option>
                <option value="english">English</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input className="form-input" type="email" placeholder="your@email.com" required {...f('email')} />
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input className="form-input" type="password" placeholder="Min 6 chars" required {...f('password')} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input className="form-input" type="password" placeholder="Repeat password" required {...f('confirm')} />
            </div>
          </div>

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? '⏳ Creating account...' : '✅ Register'}
          </button>
        </form>

        <div style={{textAlign:'center', marginTop:'16px', fontSize:'0.88rem', color:'var(--text-muted)'}}>
          Already registered?{' '}
          <Link to="/login" className="auth-link">Login here</Link>
        </div>
      </div>
    </div>
  );
}
