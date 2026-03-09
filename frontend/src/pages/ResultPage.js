import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';
import AdBanner from '../components/AdBanner';

export default function ResultPage() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [questions, setQuestions] = useState({});
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get(`/results/${id}`).then(res => {
      setResult(res.data.result);
      setQuestions(res.data.questions);
    }).catch(() => toast.error('Failed to load result'))
    .finally(() => setLoading(false));
  }, [id]);

  const getGrade = (pct) => {
    if (pct >= 90) return { label: 'Outstanding! 🌟', emoji: '🥇', color: '#FFD700' };
    if (pct >= 80) return { label: 'Excellent! 🎉', emoji: '🥈', color: '#C0C0C0' };
    if (pct >= 70) return { label: 'Very Good! 👏', emoji: '🏅', color: '#CD7F32' };
    if (pct >= 60) return { label: 'Good! 👍', emoji: '😊', color: '#4caf50' };
    if (pct >= 40) return { label: 'Average', emoji: '😐', color: '#ff9800' };
    return { label: 'Needs Improvement', emoji: '💪', color: '#f44336' };
  };

  const shareResult = (platform) => {
    const url = `${window.location.origin}/result/share/${result.shareToken}`;
    const text = `🎓 मैंने Krishna Classes में ${result.chapter} का टेस्ट दिया!\n✅ Score: ${result.score}/${result.maxScore} (${result.percentage}%)\n📊 ${result.correct} सही, ${result.wrong} गलत\n\nJoin: ${url}`;
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(url);
    const urls = {
      whatsapp: `https://wa.me/?text=${encodedText}`,
      facebook: `https://facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
    };
    if (urls[platform]) window.open(urls[platform], '_blank');
    else { navigator.clipboard.writeText(url); toast.success('Link copied!'); }
  };

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;
  if (!result) return <div className="page"><div style={{color:'var(--error)'}}>Result not found</div></div>;

  const grade = getGrade(result.percentage);
  const filteredAnswers = result.answers?.filter(a => {
    if (filter === 'correct') return a.isCorrect;
    if (filter === 'wrong') return !a.isCorrect && a.selectedOption !== -1;
    if (filter === 'skipped') return a.selectedOption === -1;
    return true;
  });

  return (
    <div className="page">
      {/* Result hero */}
      <div className="result-hero">
        <div style={{fontSize:'4rem', marginBottom:'8px'}}>{grade.emoji}</div>
        <div style={{fontSize:'1.5rem', fontWeight:'700', marginBottom:'4px'}}>{grade.label}</div>
        <div style={{opacity:'0.8', marginBottom:'20px'}}>{result.chapter} • Class {result.className}</div>

        <div className="result-score-ring">
          <div className="result-percentage">{result.percentage}%</div>
          <div style={{fontSize:'0.8rem', color:'rgba(255,255,255,0.7)'}}>{result.score}/{result.maxScore}</div>
        </div>

        <div className="result-stats">
          <div className="result-stat">
            <div className="result-stat-val" style={{color:'#69f0ae'}}>{result.correct}</div>
            <div className="result-stat-lbl">✅ Correct</div>
          </div>
          <div className="result-stat">
            <div className="result-stat-val" style={{color:'#ff5252'}}>{result.wrong}</div>
            <div className="result-stat-lbl">❌ Wrong</div>
          </div>
          <div className="result-stat">
            <div className="result-stat-val" style={{color:'#ffd740'}}>{result.skipped}</div>
            <div className="result-stat-lbl">⏭ Skipped</div>
          </div>
          <div className="result-stat">
            <div className="result-stat-val">{Math.floor(result.timeTaken/60)}m {result.timeTaken%60}s</div>
            <div className="result-stat-lbl">⏱ Time</div>
          </div>
        </div>
      </div>

      {/* Share buttons */}
      <div className="card" style={{padding:'24px', marginBottom:'20px'}}>
        <div style={{fontWeight:'700', color:'var(--navy)', marginBottom:'12px', textAlign:'center'}}>
          📤 Share Your Result
        </div>
        <div className="share-buttons">
          <button className="share-btn share-whatsapp" onClick={() => shareResult('whatsapp')}>
            📱 WhatsApp
          </button>
          <button className="share-btn share-facebook" onClick={() => shareResult('facebook')}>
            📘 Facebook
          </button>
          <button className="share-btn share-twitter" onClick={() => shareResult('twitter')}>
            🐦 Twitter
          </button>
          <button className="share-btn share-copy" onClick={() => shareResult('copy')}>
            🔗 Copy Link
          </button>
        </div>
      </div>

      <AdBanner slot="result-page" />

      {/* Review mistakes */}
      <div className="card" style={{marginBottom:'20px'}}>
        <div style={{padding:'20px 24px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div style={{fontWeight:'700', color:'var(--navy)'}}>📚 Review Your Answers</div>
          <button className="btn btn-outline btn-sm" onClick={() => setShowReview(!showReview)}>
            {showReview ? '▲ Hide' : '▼ Show Review'}
          </button>
        </div>

        {showReview && (
          <div>
            <div style={{padding:'12px 24px', borderBottom:'1px solid var(--border)', display:'flex', gap:'8px', flexWrap:'wrap'}}>
              {['all','correct','wrong','skipped'].map(f => (
                <button key={f} className={`tab ${filter === f ? 'active' : ''}`}
                  style={{flex:'none', width:'auto', padding:'8px 16px'}}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? `All (${result.totalQuestions})` :
                   f === 'correct' ? `✅ Correct (${result.correct})` :
                   f === 'wrong' ? `❌ Wrong (${result.wrong})` :
                   `⏭ Skipped (${result.skipped})`}
                </button>
              ))}
            </div>

            <div style={{padding:'20px'}}>
              {filteredAnswers?.map((ans, idx) => {
                const q = questions[ans.questionId];
                if (!q) return null;
                return (
                  <div key={idx} style={{
                    marginBottom:'20px', padding:'20px', borderRadius:'12px',
                    background: ans.isCorrect ? 'var(--success-light)' : ans.selectedOption === -1 ? 'var(--gold-pale)' : 'var(--error-light)',
                    border: `2px solid ${ans.isCorrect ? 'var(--success)' : ans.selectedOption === -1 ? 'var(--gold)' : 'var(--error)'}`
                  }}>
                    <div style={{fontWeight:'600', marginBottom:'12px', color:'var(--text)'}}>
                      Q{idx+1}. {q.questionText}
                    </div>
                    <div style={{display:'flex', flexDirection:'column', gap:'8px', marginBottom:'12px'}}>
                      {q.options?.map((opt, i) => {
                        const isSelected = ans.selectedOption === i;
                        const isCorrect = i === q.correctOption;
                        return (
                          <div key={i} style={{
                            padding:'10px 14px', borderRadius:'8px',
                            background: isCorrect ? '#e8f5e9' : isSelected && !isCorrect ? '#ffebee' : 'white',
                            border: `1px solid ${isCorrect ? '#66bb6a' : isSelected ? '#ef9a9a' : '#ddd'}`,
                            display:'flex', gap:'10px', alignItems:'flex-start'
                          }}>
                            <span style={{fontWeight:'700', color: isCorrect ? 'var(--success)' : isSelected ? 'var(--error)' : 'var(--text-muted)'}}>
                              {['A','B','C','D'][i]}
                            </span>
                            <span>{opt.text}</span>
                            {isCorrect && <span style={{marginLeft:'auto', color:'var(--success)', fontWeight:'700'}}>✅</span>}
                            {isSelected && !isCorrect && <span style={{marginLeft:'auto', color:'var(--error)', fontWeight:'700'}}>❌</span>}
                          </div>
                        );
                      })}
                    </div>
                    {q.explanation && (
                      <div style={{padding:'10px 14px', background:'rgba(26,35,126,0.05)', borderRadius:'8px', fontSize:'0.88rem'}}>
                        💡 <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{display:'flex', gap:'12px', flexWrap:'wrap'}}>
        <Link to="/select-test" className="btn btn-primary">📝 Take Another Test</Link>
        <Link to="/leaderboard" className="btn btn-secondary">🏆 View Leaderboard</Link>
        <Link to="/" className="btn btn-outline">🏠 Dashboard</Link>
      </div>
    </div>
  );
}
