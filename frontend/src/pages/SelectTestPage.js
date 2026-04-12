import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import AdBanner from '../components/AdBanner';

export default function SelectTestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meta, setMeta] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customCount, setCustomCount] = useState('');
  const [useCustom, setUseCustom] = useState(false);
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
  const subjects = [...new Set(meta.filter(m => m._id.className === selected.className).map(m => m._id.subject).filter(Boolean))].sort();
  const chapters = meta.filter(m =>
    m._id.className === selected.className &&
    (!selected.subject || m._id.subject === selected.subject)
  );

  const maxAvailable = chapters.find(c => c._id.chapter === selected.chapter)?.count || 100;

  const handleCustomCount = (val) => {
    setCustomCount(val);
    const num = parseInt(val);
    if (!isNaN(num) && num > 0) {
      setSelected({ ...selected, questionCount: num });
    }
  };

  const handleStart = () => {
    if (!selected.className || !selected.chapter) return toast.warning('Please select class and chapter');
    const chapterData = chapters.find(c => c._id.chapter === selected.chapter);
    if (!chapterData || chapterData.count < 5) return toast.warning('Not enough questions in this chapter');
    if (useCustom) {
      const num = parseInt(customCount);
      if (isNaN(num) || num < 1) return toast.warning('Please enter a valid number of questions');
      if (num > maxAvailable) return toast.warning(`Only ${maxAvailable} questions available in this chapter`);
      if (num > 100) return toast.warning('Maximum 100 questions allowed per test');
    }
    navigate('/test', { state: selected });
  };

  return (
    <div className="page">
      <div className="page-title">📝 Start Test</div>
      <div className="page-subtitle">Select your test options below</div>

      <div style={{ maxWidth: '600px' }}>

        {/* Language */}
        <div className="card" style={{ marginBottom: '20px', padding: '24px' }}>
          <div style={{ fontWeight: '700', color: 'var(--navy)', marginBottom: '12px', fontSize: '1rem' }}>
            🌐 Select Medium / माध्यम चुनें
          </div>
          <div className="lang-toggle" style={{ width: 'fit-content' }}>
            <button className={`lang-btn ${selected.language === 'hindi' ? 'active' : ''}`}
              onClick={() => setSelected({ ...selected, language: 'hindi', subject: '', chapter: '' })}>
              🇮🇳 हिंदी</button>
            <button className={`lang-btn ${selected.language === 'english' ? 'active' : ''}`}
              onClick={() => setSelected({ ...selected, language: 'english', subject: '', chapter: '' })}>
              🇬🇧 English</button>
          </div>
        </div>

        {/* Class */}
        <div className="card" style={{ marginBottom: '20px', padding: '24px' }}>
          <div style={{ fontWeight: '700', color: 'var(--navy)', marginBottom: '12px' }}>
            🏫 Select Class / कक्षा चुनें
          </div>
          {loading ? <div className="spinner" style={{ margin: '0 auto' }} /> : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {classes.map(c => (
                <button key={c}
                  style={{
                    padding: '10px 20px', borderRadius: '8px', border: '2px solid',
                    borderColor: selected.className === c ? 'var(--gold)' : 'var(--border)',
                    background: selected.className === c ? 'var(--gold)' : 'white',
                    color: selected.className === c ? 'white' : 'var(--text)',
                    fontWeight: '600', cursor: 'pointer', transition: 'var(--transition)',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                  onClick={() => setSelected({ ...selected, className: c, subject: '', chapter: '' })}
                >Class {c}</button>
              ))}
              {classes.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No classes available for this medium</div>}
            </div>
          )}
        </div>

        {/* Subject */}
        {selected.className && (
          <div className="card" style={{ marginBottom: '20px', padding: '24px' }}>
            <div style={{ fontWeight: '700', color: 'var(--navy)', marginBottom: '12px' }}>
              📚 Select Subject / विषय चुनें
            </div>
            {subjects.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>No subjects found for this class</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <button onClick={() => setSelected({ ...selected, subject: '', chapter: '' })}
                  style={{
                    padding: '10px 20px', borderRadius: '8px', border: '2px solid',
                    borderColor: selected.subject === '' ? 'var(--deep-blue)' : 'var(--border)',
                    background: selected.subject === '' ? 'var(--deep-blue)' : 'white',
                    color: selected.subject === '' ? 'white' : 'var(--text)',
                    fontWeight: '600', cursor: 'pointer', fontFamily: 'Poppins, sans-serif'
                  }}>📋 All Subjects</button>
                {subjects.map(s => (
                  <button key={s} onClick={() => setSelected({ ...selected, subject: s, chapter: '' })}
                    style={{
                      padding: '10px 20px', borderRadius: '8px', border: '2px solid',
                      borderColor: selected.subject === s ? 'var(--deep-blue)' : 'var(--border)',
                      background: selected.subject === s ? 'var(--deep-blue)' : 'white',
                      color: selected.subject === s ? 'white' : 'var(--text)',
                      fontWeight: '600', cursor: 'pointer', fontFamily: 'Poppins, sans-serif'
                    }}>{s}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ad */}
        {selected.className && <AdBanner slot="select-test-mid" />}

        {/* Chapter */}
        {selected.className && (
          <div className="card" style={{ marginBottom: '20px', padding: '24px' }}>
            <div style={{ fontWeight: '700', color: 'var(--navy)', marginBottom: '12px' }}>
              📖 Select Chapter / अध्याय चुनें
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {chapters.map(c => (
                <div key={c._id.chapter}
                  onClick={() => setSelected({ ...selected, chapter: c._id.chapter })}
                  style={{
                    padding: '14px 16px', borderRadius: '8px', border: '2px solid',
                    borderColor: selected.chapter === c._id.chapter ? 'var(--gold)' : 'var(--border)',
                    background: selected.chapter === c._id.chapter ? 'var(--gold-pale)' : 'white',
                    cursor: 'pointer', transition: 'var(--transition)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: '500' }}>{c._id.chapter}</span>
                    {c._id.subject && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                        ({c._id.subject})
                      </span>
                    )}
                  </div>
                  <span style={{
                    background: 'var(--navy)', color: 'white', padding: '2px 10px',
                    borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', flexShrink: 0
                  }}>{c.count} Qs</span>
                </div>
              ))}
              {chapters.length === 0 && (
                <div style={{ color: 'var(--text-muted)' }}>No chapters found for selected filters</div>
              )}
            </div>
          </div>
        )}

        {/* Question Count */}
        {selected.chapter && (
          <div className="card" style={{ marginBottom: '20px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontWeight: '700', color: 'var(--navy)' }}>🔢 Number of Questions</div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Available: <strong style={{ color: 'var(--navy)' }}>{maxAvailable}</strong> Qs
              </span>
            </div>

            {/* Preset buttons */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {[10, 20, 30, 50].map(n => (
                <button key={n}
                  onClick={() => {
                    setUseCustom(false);
                    setCustomCount('');
                    setSelected({ ...selected, questionCount: n });
                  }}
                  disabled={n > maxAvailable}
                  style={{
                    padding: '10px 24px', borderRadius: '8px', border: '2px solid',
                    borderColor: !useCustom && selected.questionCount === n ? 'var(--gold)' : 'var(--border)',
                    background: !useCustom && selected.questionCount === n ? 'var(--gold)' : 'white',
                    color: !useCustom && selected.questionCount === n ? 'white' : 'var(--text)',
                    fontWeight: '600', cursor: n > maxAvailable ? 'not-allowed' : 'pointer',
                    fontFamily: 'Poppins, sans-serif',
                    opacity: n > maxAvailable ? 0.4 : 1
                  }}
                >{n}</button>
              ))}

              {/* Custom button */}
              <button
                onClick={() => { setUseCustom(true); setCustomCount(''); }}
                style={{
                  padding: '10px 20px', borderRadius: '8px', border: '2px solid',
                  borderColor: useCustom ? 'var(--deep-blue)' : 'var(--border)',
                  background: useCustom ? 'var(--deep-blue)' : 'white',
                  color: useCustom ? 'white' : 'var(--text)',
                  fontWeight: '600', cursor: 'pointer', fontFamily: 'Poppins, sans-serif'
                }}
              >✏️ Custom</button>
            </div>

            {/* Custom number input */}
            {useCustom && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                <input
                  type="number"
                  className="form-input"
                  placeholder={`Enter 1 – ${Math.min(maxAvailable, 100)}`}
                  value={customCount}
                  min={1}
                  max={Math.min(maxAvailable, 100)}
                  onChange={e => handleCustomCount(e.target.value)}
                  style={{ maxWidth: '200px', fontWeight: 600 }}
                  autoFocus
                />
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Max: <strong>{Math.min(maxAvailable, 100)}</strong>
                </span>
              </div>
            )}

            {/* Summary */}
            <div style={{
              marginTop: '14px', padding: '10px 14px',
              background: 'rgba(26,35,126,0.05)', borderRadius: '8px',
              display: 'flex', gap: '20px', flexWrap: 'wrap'
            }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                ✅ Questions: <strong style={{ color: 'var(--navy)', fontSize: '15px' }}>
                  {useCustom ? (customCount || '—') : selected.questionCount}
                </strong>
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                ⏱ Est. time: <strong style={{ color: 'var(--navy)' }}>
                  {Math.min((useCustom ? parseInt(customCount) || 0 : selected.questionCount) * 2, 60)} min
                </strong>
              </span>
            </div>
          </div>
        )}

        {selected.chapter && (
          <button className="btn btn-primary btn-full"
            style={{ fontSize: '1.1rem', padding: '16px' }}
            onClick={handleStart}>
            🚀 Start Test Now
          </button>
        )}

      </div>
    </div>
  );
}