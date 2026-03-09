import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const CLASSES = ['1','2','3','4','5','6','7','8','9','10','11','12','BA','BSC','BCOM'];

export default function AdminReports() {
  const [filters, setFilters] = useState({ className:'', chapter:'', isActive:'' });
  const [loading, setLoading] = useState({ users:false, ranks:false });

  const downloadReport = async (type) => {
    setLoading(l=>({...l, [type]:true}));
    try {
      const params = {};
      if (type === 'users') {
        if (filters.className) params.className = filters.className;
        if (filters.isActive !== '') params.isActive = filters.isActive;
      } else {
        if (filters.className) params.className = filters.className;
        if (filters.chapter) params.chapter = filters.chapter;
      }

      const res = await api.get(`/admin/reports/${type}`, {
        params,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `krishna_classes_${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded successfully!');
    } catch (err) {
      toast.error('Failed to download report');
    } finally {
      setLoading(l=>({...l, [type]:false}));
    }
  };

  return (
    <div className="page">
      <div className="page-title">📋 Reports & Analytics</div>
      <div className="page-subtitle">Download Excel reports with filters</div>

      {/* Filters */}
      <div className="card" style={{padding:'24px', marginBottom:'20px'}}>
        <div style={{fontWeight:'700', color:'var(--navy)', marginBottom:'16px'}}>🔍 Filter Options</div>
        <div style={{display:'flex', gap:'12px', flexWrap:'wrap'}}>
          <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
            <label style={{fontSize:'0.82rem', fontWeight:'600', color:'var(--text-muted)'}}>Class</label>
            <select className="form-input form-select" style={{maxWidth:'150px'}} value={filters.className} onChange={e=>setFilters({...filters,className:e.target.value})}>
              <option value="">All Classes</option>
              {CLASSES.map(c=><option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
            <label style={{fontSize:'0.82rem', fontWeight:'600', color:'var(--text-muted)'}}>Chapter (for rank report)</label>
            <input className="form-input" style={{maxWidth:'220px'}} placeholder="e.g. Chapter 1" value={filters.chapter} onChange={e=>setFilters({...filters,chapter:e.target.value})} />
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
            <label style={{fontSize:'0.82rem', fontWeight:'600', color:'var(--text-muted)'}}>Status (for users report)</label>
            <select className="form-input form-select" style={{maxWidth:'150px'}} value={filters.isActive} onChange={e=>setFilters({...filters,isActive:e.target.value})}>
              <option value="">All Status</option>
              <option value="true">Active Only</option>
              <option value="false">Blocked Only</option>
            </select>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
            <label style={{fontSize:'0.82rem', fontWeight:'600', color:'var(--text-muted)'}}>Action</label>
            <button className="btn btn-outline btn-sm" onClick={()=>setFilters({className:'',chapter:'',isActive:''})}>Clear Filters</button>
          </div>
        </div>
      </div>

      {/* Download cards */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'20px'}}>
        <div className="card" style={{padding:'28px', borderLeft:'4px solid var(--deep-blue)'}}>
          <div style={{fontSize:'2.5rem', marginBottom:'12px'}}>👥</div>
          <div style={{fontSize:'1.2rem', fontWeight:'700', color:'var(--navy)', marginBottom:'8px'}}>
            Students Report
          </div>
          <div style={{color:'var(--text-muted)', fontSize:'0.88rem', marginBottom:'20px'}}>
            Download all student registrations with name, father's name, class, email, score, and status.
            {filters.className && ` Filtered: Class ${filters.className}.`}
          </div>
          <button className="btn btn-secondary btn-full" onClick={()=>downloadReport('users')} disabled={loading.users}>
            {loading.users ? '⏳ Generating...' : '📥 Download Users Report (XLSX)'}
          </button>
        </div>

        <div className="card" style={{padding:'28px', borderLeft:'4px solid var(--gold-dark)'}}>
          <div style={{fontSize:'2.5rem', marginBottom:'12px'}}>🏆</div>
          <div style={{fontSize:'1.2rem', fontWeight:'700', color:'var(--navy)', marginBottom:'8px'}}>
            Rankings Report
          </div>
          <div style={{color:'var(--text-muted)', fontSize:'0.88rem', marginBottom:'20px'}}>
            Download rank report.
            {filters.chapter ? ` Chapter: "${filters.chapter}"` : filters.className ? ` Class ${filters.className} overall.` : ' Overall rankings.'}
          </div>
          <button className="btn btn-primary btn-full" onClick={()=>downloadReport('ranks')} disabled={loading.ranks}>
            {loading.ranks ? '⏳ Generating...' : '📥 Download Ranks Report (XLSX)'}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="card" style={{padding:'24px', marginTop:'20px', background:'var(--gold-pale)', border:'1px solid var(--gold)'}}>
        <div style={{fontWeight:'700', color:'var(--gold-dark)', marginBottom:'8px'}}>💡 Tips</div>
        <ul style={{color:'var(--text-muted)', fontSize:'0.88rem', paddingLeft:'20px', lineHeight:'2'}}>
          <li>Leave all filters empty to download the full report</li>
          <li>For chapter-wise rank report: select class + enter chapter name</li>
          <li>For class-wise rank report: select only the class</li>
          <li>Reports are in Excel (.xlsx) format - open with Microsoft Excel or Google Sheets</li>
        </ul>
      </div>
    </div>
  );
}
