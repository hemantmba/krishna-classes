import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadUsers = () => {
    setLoading(true);
    api.get('/admin/users', { params: { search, className: classFilter, page, limit: 20 } })
      .then(res => { setUsers(res.data.users); setTotalPages(res.data.pages); setTotal(res.data.total); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, [page]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); loadUsers(); };

  const toggleUser = async (id) => {
    try {
      const res = await api.patch(`/admin/users/${id}/toggle`);
      setUsers(u => u.map(user => user._id === id ? {...user, isActive: res.data.isActive} : user));
      toast.success(res.data.message);
    } catch { toast.error('Failed'); }
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This will also delete their test results.`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(u => u.filter(user => user._id !== id));
      toast.success('User deleted');
    } catch { toast.error('Failed to delete user'); }
  };

  return (
    <div className="page">
      <div className="page-title">👥 Manage Users</div>
      <div style={{color:'var(--text-muted)', marginBottom:'20px'}}>Total: {total} students</div>

      <form onSubmit={handleSearch} style={{display:'flex', gap:'12px', marginBottom:'20px', flexWrap:'wrap'}}>
        <input className="form-input" style={{maxWidth:'280px'}} placeholder="Search by name or email..."
          value={search} onChange={e=>setSearch(e.target.value)} />
        <input className="form-input" style={{maxWidth:'120px'}} placeholder="Class e.g. 10"
          value={classFilter} onChange={e=>setClassFilter(e.target.value)} />
        <button className="btn btn-primary" type="submit">🔍 Search</button>
        <button className="btn btn-outline" type="button" onClick={()=>{setSearch('');setClassFilter('');setPage(1);loadUsers();}}>Clear</button>
      </form>

      <div className="card" style={{overflowX:'auto'}}>
        {loading ? <div className="loading-center"><div className="spinner"></div></div> : (
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Name</th><th>Father</th><th>Class</th><th>Email</th><th>Score</th><th>Tests</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u._id}>
                  <td style={{color:'var(--text-muted)'}}>{(page-1)*20+i+1}</td>
                  <td style={{fontWeight:'600'}}>{u.name}</td>
                  <td>{u.fatherName}</td>
                  <td><span className="badge badge-navy">Class {u.className}</span></td>
                  <td style={{fontSize:'0.85rem', color:'var(--text-muted)'}}>{u.email}</td>
                  <td style={{fontWeight:'700', color:'var(--navy)'}}>{u.totalScore}</td>
                  <td>{u.totalTests}</td>
                  <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-error'}`}>{u.isActive ? '✅ Active' : '❌ Blocked'}</span></td>
                  <td>
                    <div style={{display:'flex', gap:'6px'}}>
                      <button className={`btn btn-sm ${u.isActive ? 'btn-outline' : 'btn-primary'}`} onClick={()=>toggleUser(u._id)}>
                        {u.isActive ? '🚫' : '✅'}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={()=>deleteUser(u._id, u.name)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan="9" style={{textAlign:'center', padding:'40px', color:'var(--text-muted)'}}>No users found</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      <div style={{display:'flex', justifyContent:'center', gap:'12px', marginTop:'16px'}}>
        <button className="btn btn-outline btn-sm" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
        <span style={{padding:'8px 16px', color:'var(--text-muted)'}}>Page {page}/{totalPages}</span>
        <button className="btn btn-outline btn-sm" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>Next →</button>
      </div>
    </div>
  );
}
