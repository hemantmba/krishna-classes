import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';
import LatexText from '../components/LatexText';

// Shuffle options and track correct answer position
function shuffleOptions(questions) {
  return questions.map(q => {
    const optionsWithIndex = q.options.map((opt, idx) => ({ ...opt, originalIndex: idx }));
    // Fisher-Yates shuffle
    for (let i = optionsWithIndex.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [optionsWithIndex[i], optionsWithIndex[j]] = [optionsWithIndex[j], optionsWithIndex[i]];
    }
    return { ...q, options: optionsWithIndex };
  });
}

export default function TestPage() {
  const { state: config } = useLocation();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tabWarnings, setTabWarnings] = useState(0);
  const [showTabAlert, setShowTabAlert] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const startTime = useRef(Date.now());
  const timerRef = useRef(null);

  // Load questions and shuffle options
  useEffect(() => {
    if (!config) { navigate('/select-test'); return; }
    api.get('/questions/test', {
      params: { className: config.className, chapter: config.chapter, medium: config.language, limit: config.questionCount }
    }).then(res => {
      if (!res.data.questions.length) {
        toast.error('No questions found for this selection');
        navigate('/select-test');
        return;
      }
      // Shuffle options for each question
      const shuffled = shuffleOptions(res.data.questions);
      setQuestions(shuffled);
      const mins = Math.min(shuffled.length * 2, 60);
      setTimeLeft(mins * 60);
    }).catch(() => {
      toast.error('Failed to load questions');
      navigate('/select-test');
    }).finally(() => setLoading(false));
  }, []);

  // Timer
  useEffect(() => {
    if (!questions.length || loading) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); submitTest(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [questions.length, loading]);

  // Tab switch detection
  useEffect(() => {
    const handleBlur = () => {
      setTabWarnings(w => {
        const newW = w + 1;
        if (newW >= 3) {
          toast.error('⚠️ Test auto-submitted due to multiple tab switches!');
          submitTest(true);
        } else {
          setShowTabAlert(true);
          setTimeout(() => setShowTabAlert(false), 3000);
          toast.warning(`⚠️ Tab switch detected! Warning ${newW}/3`);
        }
        return newW;
      });
    };
    const handleVisibility = () => { if (document.hidden) handleBlur(); };
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const submitTest = useCallback(async (auto = false) => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    const timeTaken = Math.round((Date.now() - startTime.current) / 1000);

    // Map shuffled option index back to original index
    const answersArr = questions.map(q => {
      const selectedShuffledIdx = answers[q._id] ?? -1;
      let originalIndex = -1;
      if (selectedShuffledIdx !== -1) {
        originalIndex = q.options[selectedShuffledIdx]?.originalIndex ?? -1;
      }
      return {
        questionId: q._id,
        selectedOption: originalIndex
      };
    });

    try {
      const res = await api.post('/results/submit', {
        className: config.className, chapter: config.chapter,
        subject: config.subject, medium: config.language,
        answers: answersArr, timeTaken
      });
      if (!auto) toast.success('Test submitted successfully! 🎉');
      navigate(`/result/${res.data.result._id}`);
    } catch (err) {
      toast.error('Submission failed. Retrying...');
      setSubmitting(false);
    }
  }, [questions, answers, config, submitting]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60), s = secs % 60;
    return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  if (loading) return (
    <div className="loading-center" style={{minHeight:'100vh', background:'var(--bg)'}}>
      <div style={{textAlign:'center'}}>
        <div className="spinner" style={{margin:'0 auto 16px'}}></div>
        <div style={{fontWeight:'600', color:'var(--navy)'}}>Loading questions...</div>
      </div>
    </div>
  );

  const q = questions[current];
  const answered = Object.keys(answers).length;
  const progressPct = (answered / questions.length) * 100;

  return (
    <div style={{background:'var(--bg)', minHeight:'100vh'}}>
      {showTabAlert && (
        <div className="tab-warning">
          ⚠️ Tab switch detected! Warning {tabWarnings}/3. Auto-submit at 3 warnings.
        </div>
      )}

      {/* Test header */}
      <div className="test-header" style={{borderRadius:'0', position:'sticky', top:0, zIndex:40}}>
        <div>
          <div style={{fontSize:'0.85rem', opacity:'0.8', marginBottom:'2px'}}>{config.chapter} | Class {config.className}</div>
          <div className="test-progress">Q{current+1} of {questions.length} | ✅ {answered} answered</div>
          <div style={{marginTop:'8px', width:'200px'}}>
            <div className="progress-bar">
              <div className="progress-fill" style={{width:`${progressPct}%`}}></div>
            </div>
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <div className={`test-timer ${timeLeft < 60 ? 'warning' : ''}`}>⏱ {formatTime(timeLeft)}</div>
          <button className="btn btn-primary btn-sm" style={{marginTop:'8px'}} onClick={() => setShowSubmitConfirm(true)} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Test'}
          </button>
        </div>
      </div>

      <div style={{display:'flex', gap:'20px', padding:'20px', maxWidth:'1100px', margin:'0 auto'}}>
        {/* Question area */}
        <div style={{flex:1}}>
          <div className="question-card">
            <div className="question-number">Question {current + 1} of {questions.length}</div>

            {/* Question text */}
            <div className="question-text">
              {q?.questionImage && (
                <img
                  src={`${process.env.REACT_APP_API_URL?.replace('/api','')}/${q.questionImage}`}
                  alt="question"
                  className="question-image"
                />
              )}
              <LatexText text={q?.questionText} />
            </div>

            {/* Shuffled Options */}
            <div className="options-grid">
              {q?.options.map((opt, idx) => (
                <div
                  key={idx}
                  className={`option-item ${answers[q._id] === idx ? 'selected' : ''}`}
                  onClick={() => setAnswers({...answers, [q._id]: idx})}
                >
                  <div className="option-label">{['A','B','C','D'][idx]}</div>
                  <div className="option-text">
                    {opt.image && (
                      <img
                        src={`${process.env.REACT_APP_API_URL?.replace('/api','')}/${opt.image}`}
                        alt="opt"
                        style={{maxHeight:'60px', display:'block', marginBottom:'4px'}}
                      />
                    )}
                    <LatexText text={opt.text} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div style={{display:'flex', gap:'12px', marginTop:'16px'}}>
            <button className="btn btn-outline" onClick={() => setCurrent(c => Math.max(0, c-1))} disabled={current === 0}>
              ← Previous
            </button>
            <button className="btn btn-secondary" onClick={() => setAnswers(a => { const n = {...a}; delete n[q._id]; return n; })}>
              Clear Answer
            </button>
            <button
              className="btn btn-primary"
              style={{marginLeft:'auto'}}
              onClick={() => current < questions.length - 1 ? setCurrent(c => c+1) : setShowSubmitConfirm(true)}
            >
              {current < questions.length - 1 ? 'Next →' : '✅ Submit'}
            </button>
          </div>
        </div>

        {/* Question palette */}
        <div className="card" style={{width:'220px', height:'fit-content', position:'sticky', top:'80px'}}>
          <div style={{padding:'12px 16px', borderBottom:'1px solid var(--border)', fontWeight:'700', fontSize:'0.9rem', color:'var(--navy)'}}>
            📋 Question Map
          </div>
          <div className="q-palette">
            {questions.map((qq, i) => (
              <button
                key={i}
                className={`q-btn ${i === current ? 'current' : answers[qq._id] !== undefined ? 'answered' : ''}`}
                onClick={() => setCurrent(i)}
              >{i + 1}</button>
            ))}
          </div>
          <div style={{padding:'12px 16px', borderTop:'1px solid var(--border)', fontSize:'0.75rem'}}>
            <div style={{display:'flex', gap:'8px', alignItems:'center', marginBottom:'4px'}}>
              <div style={{width:'16px',height:'16px',background:'var(--gold)',borderRadius:'4px'}}></div>
              Answered ({answered})
            </div>
            <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
              <div style={{width:'16px',height:'16px',background:'white',border:'2px solid var(--border)',borderRadius:'4px'}}></div>
              Not answered ({questions.length - answered})
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirm Modal */}
      {showSubmitConfirm && (
        <div className="modal-overlay" onClick={() => setShowSubmitConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{fontSize:'2rem', textAlign:'center', marginBottom:'12px'}}>📤</div>
            <div style={{fontSize:'1.2rem', fontWeight:'700', color:'var(--navy)', textAlign:'center', marginBottom:'8px'}}>
              Submit Test?
            </div>
            <div style={{color:'var(--text-muted)', textAlign:'center', marginBottom:'24px'}}>
              You have answered {answered} out of {questions.length} questions.
              {questions.length - answered > 0 && ` ${questions.length - answered} questions are unattempted.`}
            </div>
            <div style={{display:'flex', gap:'12px'}}>
              <button className="btn btn-outline btn-full" onClick={() => setShowSubmitConfirm(false)}>Review</button>
              <button
                className="btn btn-primary btn-full"
                onClick={() => { setShowSubmitConfirm(false); submitTest(); }}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : '✅ Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}