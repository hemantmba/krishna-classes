import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import AdBanner from '../components/AdBanner';

export default function HomePage() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [classRank, setClassRank] = useState(null);
  const [subjectStats, setSubjectStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rankLoading, setRankLoading] = useState(true);

  useEffect(() => {
    // Load recent test history
    api.get('/results/history/me?limit=5')
      .then(res => setHistory(res.data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Load overall rank
    api.get('/leaderboard/overall')
      .then(res => {
        const rank = res.data.myRank;
        setMyRank(rank);
      })
      .catch(() => {})
      .finally(() => setRankLoading(false));

    // Load class rank
    if (user?.className) {
      api.get('/leaderboard/class', { params: { className: user.className } })
        .then(res => setClassRank(res.data.myRank))
        .catch(() => {});
    }

    // Load subject-wise stats from recent results
    api.get('/results/history/me?limit=50')
      .then(res => {
        const results = res.data.results || [];
        const subjectMap = {};
        results.forEach(r => {
          const subj = r.subject || r.chapter || 'General';
          if (!subjectMap[subj]) subjectMap[subj] = { total: 0, score: 0, tests: 0 };
          subjectMap[subj].total += 100;
          subjectMap[subj].score += r.percentage || 0;
          subjectMap[subj].tests++;
        });
        const stats = Object.entries(subjectMap).map(([name, data]) => ({
          name,
          avg: Math.round(data.score / data.tests),
          tests: data.tests
        })).sort((a, b) => b.tests - a.tests).slice(0, 5);
        setSubjectStats(stats);
      })
      .catch(() => {});
  }, [user?.className]);

  const getGrade = (pct) => {
    if (pct >= 90) return { label: 'A+', color: '#2e7d32', bg: '#e8f5e9' };
    if (pct >= 80) return { label: 'A', color: '#1565c0', bg: '#e3f2fd' };
    if (pct >= 70) return { label: 'B', color: '#6a1b9a', bg: '#f3e5f5' };
    if (pct >= 60) return { label: 'C', color: '#e65100', bg: '#fff3e0' };
    return { label: 'D', color: '#c62828', bg: '#ffebee' };
  };

  const getRankEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank <= 10) return '🏅';
    return '📊';
  };

  const avgScore = user?.totalTests > 0
    ? Math.round(user.totalScore / user.totalTests)
    : 0;

  return (
    <div className="page">

      {/* Hero greeting */}
      <div style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, var(--deep-blue) 100%)',
        borderRadius: 'var(--radius)', padding: '28px', marginBottom: '20px', color: 'white',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: '20px', top: '20px', fontSize: '80px', opacity: '0.08' }}>🎓</div>
        <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>
          नमस्ते, <strong style={{ color: 'var(--gold)' }}>{user?.name}</strong>! 🙏
        </div>
        <div style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '8px', fontSize: '0.9rem' }}>
          Class {user?.className} • {user?.language === 'hindi' ? 'हिंदी माध्यम' : 'English Medium'}
          {user?.schoolName && ` • ${user.schoolName}`}
        </div>
        {user?.mobileNumber && (
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: '16px' }}>
            📱 +91 {user.mobileNumber}
          </div>
        )}
        <Link to="/select-test" className="btn btn-primary">
          📝 Start New Test
        </Link>
      </div>

      {/* Rank Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
        {/* Overall Rank */}
        <div className="card" style={{
          padding: '20px', textAlign: 'center',
          background: 'linear-gradient(135deg, var(--navy), var(--deep-blue))',
          color: 'white', border: 'none'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '4px' }}>
            {rankLoading ? '⏳' : myRank ? getRankEmoji(myRank) : '—'}
          </div>
          <div style={{ fontFamily: 'Baloo 2, sans-serif', fontSize: '2rem', fontWeight: 800, color: 'var(--gold)', lineHeight: 1 }}>
            {rankLoading ? '...' : myRank ? `#${myRank}` : 'N/A'}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>🌍 Overall Rank</div>
        </div>

        {/* Class Rank */}
        <div className="card" style={{
          padding: '20px', textAlign: 'center',
          background: 'linear-gradient(135deg, var(--gold-dark), #8b6914)',
          color: 'white', border: 'none'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '4px' }}>
            {classRank ? getRankEmoji(classRank) : '📚'}
          </div>
          <div style={{ fontFamily: 'Baloo 2, sans-serif', fontSize: '2rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>
            {classRank ? `#${classRank}` : 'N/A'}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>
            📚 Class {user?.className} Rank
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
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
          <div className="stat-value">{avgScore}%</div>
          <div className="stat-label">Avg Score</div>
        </div>
        <div className="stat-card" style={{
          background: avgScore >= 70 ? 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' :
            avgScore >= 50 ? 'linear-gradient(135deg, #fff8e1, #ffecb3)' :
              'linear-gradient(135deg, #ffebee, #ffcdd2)'
        }}>
          <div className="stat-icon">
            {avgScore >= 70 ? '🌟' : avgScore >= 50 ? '💪' : '📖'}
          </div>
          <div className="stat-value" style={{
            color: avgScore >= 70 ? '#2e7d32' : avgScore >= 50 ? '#f57f17' : '#c62828', fontSize: '1.2rem'
          }}>
            {avgScore >= 70 ? 'Great!' : avgScore >= 50 ? 'Good' : 'Improve'}
          </div>
          <div className="stat-label">Performance</div>
        </div>
      </div>

      <AdBanner slot="home-mid" />

      {/* Subject-wise Performance */}
      {subjectStats.length > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">📚 Chapter-wise Performance</div>
          <div style={{ padding: '16px 20px' }}>
            {subjectStats.map((s, i) => {
              const grade = getGrade(s.avg);
              return (
                <div key={i} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{s.name}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.tests} tests</span>
                      <span style={{
                        background: grade.bg, color: grade.color,
                        padding: '2px 8px', borderRadius: '10px',
                        fontSize: '12px', fontWeight: 700
                      }}>{s.avg}%</span>
                    </div>
                  </div>
                  <div style={{ background: 'var(--border)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${s.avg}%`, height: '100%', borderRadius: '4px',
                      background: s.avg >= 70 ? '#4caf50' : s.avg >= 50 ? '#ff9800' : '#f44336',
                      transition: 'width 0.8s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent tests */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📜 Recent Tests</span>
          <Link to="/profile" style={{ color: 'var(--gold)', fontSize: '0.85rem', fontWeight: 600 }}>View All →</Link>
        </div>
        <div style={{ padding: '0' }}>
          {loading ? (
            <div className="loading-center"><div className="spinner"></div></div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📚</div>
              <div>No tests given yet.</div>
              <Link to="/select-test" className="btn btn-primary" style={{ marginTop: '12px', display: 'inline-block' }}>
                Start First Test
              </Link>
            </div>
          ) : (
            history.map(r => {
              const grade = getGrade(r.percentage);
              return (
                <Link key={r._id} to={`/result/${r._id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', padding: '14px 20px',
                    borderBottom: '1px solid var(--border)', transition: 'var(--transition)'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-pale)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '50%',
                      background: grade.bg, color: grade.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.9rem', flexShrink: 0, marginRight: '14px',
                      border: `2px solid ${grade.color}`
                    }}>{grade.label}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>
                        {r.chapter} — Class {r.className}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        ✅ {r.correct}/{r.totalQuestions} correct • ⏱ {new Date(r.createdAt).toLocaleDateString('hi-IN')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: grade.color }}>{r.percentage}%</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.score}/{r.maxScore} pts</div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Motivation banner */}
      {user?.totalTests > 0 && (
        <div style={{
          background: avgScore >= 70
            ? 'linear-gradient(135deg, #e8f5e9, #c8e6c9)'
            : 'linear-gradient(135deg, #fff8e1, #ffecb3)',
          borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: '20px',
          border: `1px solid ${avgScore >= 70 ? '#81c784' : '#ffd54f'}`,
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <div style={{ fontSize: '2rem' }}>
            {avgScore >= 80 ? '🌟' : avgScore >= 60 ? '💪' : '📖'}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '14px' }}>
              {avgScore >= 80 ? 'Excellent Performance!' : avgScore >= 60 ? 'Keep it up!' : 'You can do better!'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {avgScore >= 80 ? `You are in top performers with ${avgScore}% average. Keep going!`
                : avgScore >= 60 ? `Your average is ${avgScore}%. Try more tests to improve your rank!`
                  : `Your average is ${avgScore}%. Practice more to improve your performance.`}
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
        {[
          { icon: '📝', label: 'Start Test', sub: 'Take a chapter test', to: '/select-test', color: 'var(--navy)' },
          { icon: '🏆', label: 'Leaderboard', sub: 'See your rank', to: '/leaderboard', color: 'var(--gold-dark)' },
          { icon: '👤', label: 'My Profile', sub: 'View & edit profile', to: '/profile', color: 'var(--deep-blue)' },
        ].map(a => (
          <Link key={a.to} to={a.to} style={{ textDecoration: 'none' }}>
            <div className="card" style={{
              padding: '18px', cursor: 'pointer', transition: 'var(--transition)',
              borderLeft: `4px solid ${a.color}`
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{a.icon}</div>
              <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '2px', fontSize: '14px' }}>{a.label}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{a.sub}</div>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}