import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const parseUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
};
const parseMemberIds = (v) => v ? v.split(',').map(s=>s.trim()).filter(Boolean) : [];

const injectProjStyles = () => {
  if (document.getElementById('proj-page-styles')) return;
  const s = document.createElement('style');
  s.id = 'proj-page-styles';
  s.textContent = `
    @keyframes projSpin { to{transform:rotate(360deg);} }
    @keyframes projRowIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:none} }
    .proj-row { animation:projRowIn 0.3s ease both; transition:background 0.2s; }
    .proj-row:hover { background:rgba(255,255,255,0.04) !important; }
    .pg-btn2 {
      padding:7px 16px; border-radius:8px; cursor:pointer; font-size:13px;
      font-weight:500; font-family:inherit;
      background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);
      color:#cbd5e1; transition:background 0.2s,transform 0.15s;
    }
    .pg-btn2:hover:not(:disabled){background:rgba(255,255,255,0.11);transform:translateY(-1px);}
    .pg-btn2:disabled{opacity:.35;cursor:not-allowed;}
    .pfi {
      width:100%; padding:10px 14px; box-sizing:border-box;
      background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
      border-radius:10px; color:#f1f5f9; font-size:14px; font-family:inherit; outline:none;
      transition:border-color 0.2s,box-shadow 0.2s;
    }
    .pfi:focus{border-color:rgba(99,102,241,0.6);box-shadow:0 0 0 3px rgba(99,102,241,0.15);}
    .act-btn {
      padding:6px 14px; border-radius:8px; border:1px solid; cursor:pointer;
      font-size:12px; font-weight:600; font-family:inherit; transition:opacity 0.2s,transform 0.15s;
    }
    .act-btn:hover{opacity:0.82;transform:translateY(-1px);}
  `;
  document.head.appendChild(s);
};

const Projects = () => {
  const user    = useMemo(() => parseUser(), []);
  const isAdmin = user?.role === 'Admin';

  const [rows, setRows]             = useState([]);
  const [page, setPage]             = useState(1);
  const [limit]                     = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  const [formMode, setFormMode]     = useState('create');
  const [editingId, setEditingId]   = useState(null);
  const [name, setName]             = useState('');
  const [desc, setDesc]             = useState('');
  const [membersCsv, setMembersCsv] = useState('');
  const [saving, setSaving]         = useState(false);

  const resetForm = () => { setFormMode('create'); setEditingId(null); setName(''); setDesc(''); setMembersCsv(''); };

  const load = async (pg = page) => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/projects', { params:{page:pg, limit} });
      const p = res.data || {};
      setRows(p.data||[]); setPage(p.page||pg); setTotalPages(p.totalPages||1);
    } catch (e) { setError(e.response?.data?.message||'Failed to load projects.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { injectProjStyles(); load(1); }, []); // eslint-disable-line

  const onEdit = (p) => {
    setError(''); setFormMode('edit'); setEditingId(p._id);
    setName(p.name||''); setDesc(p.description||'');
    const ids = (p.members||[]).map(m=>typeof m==='string'?m:m?._id).filter(Boolean);
    setMembersCsv(ids.join(', '));
  };

  const onDelete = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm('Delete this project? Its tasks will also be deleted.')) return;
    setError('');
    try { await api.delete(`/projects/${id}`); setRows(prev=>prev.filter(p=>p._id!==id)); }
    catch (e) { setError(e.response?.data?.message||'Failed to delete.'); }
  };

  const onSubmit = async (e) => {
    e.preventDefault(); if (!isAdmin) return;
    const n = name.trim(), d = desc.trim();
    if (!n||!d) { setError('Name and description are required.'); return; }
    setSaving(true); setError('');
    try {
      const members = parseMemberIds(membersCsv);
      if (formMode==='create') await api.post('/projects', {name:n,description:d,members});
      else await api.put(`/projects/${editingId}`, {name:n,description:d,members});
      resetForm(); await load(page);
    } catch (e) { setError(e.response?.data?.message||'Failed to save.'); }
    finally { setSaving(false); }
  };

  const pageStyle = {
    minHeight:'calc(100vh - 60px)',
    background:'linear-gradient(145deg,#06040f 0%,#0d0920 45%,#060b18 100%)',
    fontFamily:"'Inter','Segoe UI',sans-serif", color:'#f1f5f9',
  };

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'40px 24px' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'32px', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <h1 style={{ fontSize:'28px', fontWeight:'800', color:'#f1f5f9', margin:0, letterSpacing:'-0.4px' }}>Projects</h1>
            <p style={{ color:'#64748b', margin:'4px 0 0', fontSize:'14px' }}>Page {page} of {totalPages}</p>
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            <button className="pg-btn2" disabled={page<=1||loading} onClick={()=>load(page-1)}>← Prev</button>
            <button className="pg-btn2" disabled={page>=totalPages||loading} onClick={()=>load(page+1)}>Next →</button>
          </div>
        </div>

        {/* Member notice */}
        {!isAdmin && (
          <div style={{ display:'flex', alignItems:'center', gap:'10px', background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:'12px', padding:'12px 16px', marginBottom:'20px', color:'#a78bfa', fontSize:'14px' }}>
            👁️ You are a Member. Project management is available to Admins only.
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'12px', padding:'12px 16px', marginBottom:'20px', color:'#fca5a5', fontSize:'14px' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Create / Edit form (Admin only) */}
        {isAdmin && (
          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:'16px', padding:'24px', marginBottom:'24px' }}>
            <div style={{ fontWeight:'600', fontSize:'15px', color:'#e2e8f0', marginBottom:'16px' }}>
              {formMode==='create' ? '➕ Create Project' : '✏️ Edit Project'}
            </div>
            <form onSubmit={onSubmit} style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'12px' }}>
              <input className="pfi" placeholder="Project name" value={name} onChange={e=>setName(e.target.value)} />
              <input className="pfi" placeholder="Description" value={desc} onChange={e=>setDesc(e.target.value)} />
              <input className="pfi" placeholder="Members (comma-separated User IDs)" value={membersCsv} onChange={e=>setMembersCsv(e.target.value)} style={{gridColumn:'1/-1'}} />
              <div style={{ gridColumn:'1/-1', display:'flex', gap:'10px', flexWrap:'wrap' }}>
                <button type="submit" disabled={saving} style={{ padding:'10px 24px', borderRadius:'10px', border:'none', cursor:'pointer', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontSize:'14px', fontWeight:'600', fontFamily:'inherit', opacity:saving?0.65:1, boxShadow:'0 4px 16px rgba(99,102,241,0.35)' }}>
                  {saving ? 'Saving...' : formMode==='create' ? 'Create Project' : 'Update Project'}
                </button>
                {formMode==='edit' && (
                  <button type="button" onClick={resetForm} style={{ padding:'10px 24px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.12)', cursor:'pointer', background:'rgba(255,255,255,0.06)', color:'#cbd5e1', fontSize:'14px', fontWeight:'500', fontFamily:'inherit' }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', gap:'12px', color:'#94a3b8', fontSize:'15px', padding:'40px 0' }}>
            <div style={{ width:'20px', height:'20px', borderRadius:'50%', border:'2px solid rgba(99,102,241,0.3)', borderTopColor:'#6366f1', animation:'projSpin 0.8s linear infinite' }}/>
            Loading projects...
          </div>
        ) : (
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                  {['Name','Description','Members','Actions'].map(h=>(
                    <th key={h} style={{ padding:'14px 20px', textAlign:'left', fontSize:'11px', fontWeight:'600', letterSpacing:'0.8px', textTransform:'uppercase', color:'#64748b' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding:'48px 20px', textAlign:'center', color:'#475569' }}>
                    <div style={{fontSize:'32px',marginBottom:'8px'}}>📂</div>No projects found.
                  </td></tr>
                ) : rows.map((p, i) => (
                  <tr key={p._id} className="proj-row" style={{ borderBottom:'1px solid rgba(255,255,255,0.05)', animationDelay:`${i*0.04}s` }}>
                    <td style={{ padding:'14px 20px', fontSize:'14px', fontWeight:'600', color:'#e2e8f0' }}>{p.name}</td>
                    <td style={{ padding:'14px 20px', fontSize:'13px', color:'#94a3b8', maxWidth:'260px' }}>{p.description}</td>
                    <td style={{ padding:'14px 20px' }}>
                      <span style={{ padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'600', background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', color:'#a78bfa' }}>
                        {(p.members||[]).length} member{(p.members||[]).length!==1?'s':''}
                      </span>
                    </td>
                    <td style={{ padding:'14px 20px' }}>
                      {isAdmin ? (
                        <div style={{ display:'flex', gap:'8px' }}>
                          <button className="act-btn" onClick={()=>onEdit(p)}
                            style={{ background:'rgba(99,102,241,0.15)', borderColor:'rgba(99,102,241,0.3)', color:'#a78bfa' }}>
                            Edit
                          </button>
                          <button className="act-btn" onClick={()=>onDelete(p._id)}
                            style={{ background:'rgba(239,68,68,0.12)', borderColor:'rgba(239,68,68,0.3)', color:'#f87171' }}>
                            Delete
                          </button>
                        </div>
                      ) : <span style={{color:'#334155'}}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
