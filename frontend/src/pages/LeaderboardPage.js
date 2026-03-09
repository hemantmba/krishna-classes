import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import AdBanner from '../components/AdBanner';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overall');
  const [data, setData] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState(user?.className || '');
  const [chapter, setChapter] = useState('');

  useEffect(() => {
    setLoading(true);
    let url = '';
    const params = {};
    if (tab === 'overall') url = '/leaderboard/overall';
    else if (tab === 'class') { url = '/leaderboard/class'; params.className = classFilter || user?.className; }
    else if (tab === 'chapter') { url = '/leaderboard/chapter'; params.className = classFilter; params.chapter = chapter; }

    if (tab === 'chapter' && !chapter) { setLoading(false); return; }

    api.get(url, { params }).then(res => {
      setData(res.data.leaderboard);
      setMyRank(res.data.myRank);
    }).finally(() => setLoading(false));
  }, [tab, classFilter, chapter]);

  const RankBadge = ({ rank }) => {
    const cls = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
    return <span className={`rank-badge ${cls}`}>{rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}</span>;
  };

  return (
    <div className="page">
      <div className="page-title">🏆 Leaderboard</div>
      {myRank && <div className="page-subtitle">Your current rank: <strong style={{color:'var(--gold)'}}>#{myRank}</strong></div>}

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab==='overall'?'active':''}`} onClick={()=>setTab('overall')}>🌍 Overall</button>
        <button className={`tab ${tab==='class'?'active':''}`} onClick={()=>setTab('class')}>🏫 Class-wise</button>
        <button className={`tab ${tab==='chapter'?'active':''}`} onClick={()=>setTab('chapter')}>📖 Chapter-wise</button>
      </div>

      {/* Filters */}
      {(tab === 'class' || tab === 'chapter') && (
        <div style={{display:'flex', gap:'12px', marginBottom:'20px', flexWrap:'wrap'}}>
          <input
            className="form-input" style={{maxWidth:'150px'}}
            placeholder="Class e.g. 10" value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
          />
          {tab === 'chapter' && (
            <input
              className="form-input" style={{maxWidth:'250px'}}
              placeholder="Chapter name" value={chapter}
              onChange={e => setChapter(e.target.value)}
            />
          )}
        </div>
      )}

      <AdBanner slot="top-banner" />

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="loading-center"><div className="spinner"></div></div>
        ) : !data.length ? (
          <div style={{textAlign:'center', padding:'40px', color:'var(--text-muted)'}}>
            <div style={{fontSize:'3rem', marginBottom:'8px'}}>📊</div>
            <div>No data available yet</div>
          </div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student</th>
                  <th>Class</th>
                  <th>{tab === 'chapter' ? 'Best %' : 'Total Score'}</th>
                  {tab !== 'chapter' && <th>Tests</th>}
                  {tab === 'chapter' && <th>Attempts</th>}
                </tr>
              </thead>
              <tbody>
                {data.map((entry) => {
                  const isMe = entry.userId?.toString() === user?._id || entry._id?.toString() === user?._id;
                  return (
                    <tr key={entry.rank} className={`leaderboard-row ${isMe ? 'me' : ''}`}>
                      <td><RankBadge rank={entry.rank} /></td>
                      <td>
                        <div style={{fontWeight:'600', color:'var(--text)'}}>
                          {isMe ? '👤 ' : ''}{entry.name}
                        </div>
                        {isMe && <div style={{fontSize:'0.75rem', color:'var(--gold)', fontWeight:'600'}}>You</div>}
                      </td>
                      <td><span className="badge badge-navy">Class {entry.className}</span></td>
                      <td>
                        <strong style={{color:'var(--navy)', fontFamily:'Baloo 2', fontSize:'1.1rem'}}>
                          {tab === 'chapter' ? `${entry.bestPercentage}%` : entry.totalScore || entry.bestScore}
                        </strong>
                      </td>
                      <td style={{color:'var(--text-muted)', fontSize:'0.9rem'}}>
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
