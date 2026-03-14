import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import AdBanner from '../components/AdBanner';

const CLASSES = ['1','2','3','4','5','6','7','8','9','10','11','12','BA','BSC','BCOM','Other'];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overall');
  const [data, setData] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState(user?.className || '');
  const [chapter, setChapter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [schools, setSchools] = useState([]);

  // Load schools list for dropdown
  useEffect(() => {
    api.get('/schools').then(res => setSchools(res.data.schools)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    let url = '';
    const params = {};

    if (tab === 'overall') url = '/leaderboard/overall';
    else if (tab === 'class') { url = '/leaderboard/class'; params.className = classFilter || user?.className; }
    else if (tab === 'chapter') { url = '/leaderboard/chapter'; params.className = classFilter; params.chapter = chapter; }
    else if (tab === 'school') { url = '/leaderboard/overall'; }

    if (tab === 'chapter' && !chapter) { setLoading(false); return; }

    // Add school filter for overall and school tab
    if (schoolFilter) params.schoolName = schoolFilter;

    api.get(url, { params }).then(res => {
      setData(res.data.leaderboard);
      setMyRank(res.data.myRank);
    }).finally(() => setLoading(false));
  }, [tab, classFilter, chapter, schoolFilter]);

  const RankBadge = ({ rank }) => {
    const cls = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
    return <span className={`rank-badge ${cls}`}>{rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}</span>;
  };

  return (
    <div className="page">
      <div className="page-title">🏆 Leaderboard</div>
      {myRank && (
        <div className="page-subtitle">
          Your current rank: <strong style={{ color: 'var(--gold)' }}>#{myRank}</strong>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'overall' ? 'active' : ''}`} onClick={() => setTab('overall')}>🌍 Overall</button>
        <button className={`tab ${tab === 'class' ? 'active' : ''}`} onClick={() => setTab('class')}>📚 Class-wise</button>
        <button className={`tab ${tab === 'chapter' ? 'active' : ''}`} onClick={() => setTab('chapter')}>📖 Chapter-wise</button>
        <button className={`tab ${tab === 'school' ? 'active' : ''}`} onClick={() => { setTab('school'); }}>🏫 School-wise</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>

        {/* School filter - show on overall and school tab */}
        {(tab === 'overall' || tab === 'school') && (
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--navy)', marginBottom: '4px' }}>🏫 Filter by School</div>
            <select
              className="form-input"
              value={schoolFilter}
              onChange={e => setSchoolFilter(e.target.value)}
            >
              <option value="">All Schools</option>
              {schools.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
        )}

        {/* Class filter */}
        {(tab === 'class' || tab === 'chapter') && (
          <div style={{ flex: 1, minWidth: '150px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--navy)', marginBottom: '4px' }}>📚 Class</div>
            <select
              className="form-input"
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
            >
              <option value="">All Classes</option>
              {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
        )}

        {/* Chapter filter */}
        {tab === 'chapter' && (
          <div style={{ flex: 2, minWidth: '200px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--navy)', marginBottom: '4px' }}>📖 Chapter</div>
            <input
              className="form-input"
              placeholder="Enter chapter name"
              value={chapter}
              onChange={e => setChapter(e.target.value)}
            />
          </div>
        )}

        {/* Reset button */}
        {(schoolFilter || classFilter || chapter) && (
          <button className="btn btn-outline" onClick={() => {
            setSchoolFilter(''); setClassFilter(''); setChapter('');
          }}>
            🔄 Reset
          </button>
        )}
      </div>

      {/* Active filters display */}
      {(schoolFilter || classFilter) && (
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {schoolFilter && (
            <span style={{ background: 'var(--gold)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
              🏫 {schoolFilter} ✕
            </span>
          )}
          {classFilter && (
            <span style={{ background: 'var(--navy)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
              📚 Class {classFilter} ✕
            </span>
          )}
        </div>
      )}

      <AdBanner slot="top-banner" />

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="loading-center"><div className="spinner"></div></div>
        ) : !data.length ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '8px' }}>📊</div>
            <div>No data available yet</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student</th>
                  <th>Class</th>
                  <th>School</th>
                  <th>{tab === 'chapter' ? 'Best %' : 'Total Score'}</th>
                  <th>{tab === 'chapter' ? 'Attempts' : 'Tests'}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((entry) => {
                  const isMe = entry.userId?.toString() === user?._id || entry._id?.toString() === user?._id;
                  return (
                    <tr key={entry.rank} className={`leaderboard-row ${isMe ? 'me' : ''}`}>
                      <td><RankBadge rank={entry.rank} /></td>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                          {isMe ? '👤 ' : ''}{entry.name}
                        </div>
                        {isMe && <div style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: '600' }}>You</div>}
                      </td>
                      <td><span className="badge badge-navy">Class {entry.className}</span></td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {entry.schoolName || '—'}
                      </td>
                      <td>
                        <strong style={{ color: 'var(--navy)', fontFamily: 'Baloo 2', fontSize: '1.1rem' }}>
                          {tab === 'chapter' ? `${entry.bestPercentage}%` : entry.totalScore || entry.bestScore}
                        </strong>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {tab === 'chapter' ? entry.attempts : entry.totalTests}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}