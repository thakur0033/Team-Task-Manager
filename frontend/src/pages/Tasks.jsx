import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const STATUS_OPTIONS = ['Todo', 'In Progress', 'Done'];
const STATUS_STYLE = {
  'Todo':        { bg:'rgba(99,102,241,0.15)', color:'#a78bfa', border:'rgba(99,102,241,0.3)'  },
  'In Progress': { bg:'rgba(245,158,11,0.15)', color:'#fbbf24', border:'rgba(245,158,11,0.3)' },
  'Done':        { bg:'rgba(34,197,94,0.15)',  color:'#4ade80', border:'rgba(34,197,94,0.3)'  },
};

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d) ? '—' : d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
};

const injectTaskStyles = () => {
  if (document.getElementById('task-page-styles')) return;
  const s = document.createElement('style');
  s.id = 'task-page-styles';
  s.textContent = `
    @keyframes taskSpin { to { transform:rotate(360deg); } }
    @keyframes rowIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:none} }
    .task-row { animation:rowIn 0.3s ease both; }
    .task-row:hover { background:rgba(255,255,255,0.04) !important; }
    .status-sel {
      appearance:none; -webkit-appearance:none; font-family:inherit;
      font-size:12px; font-weight:600; padding:5px 12px;
      border-radius:20px; border:1px solid; cursor:pointer; outline:none;
    }
    .status-sel:disabled { opacity:0.5; cursor:not-allowed; }
    .pg-btn {
      padding:7px 16px; border-radius:8px; cursor:pointer; font-size:13px;
      font-weight:500; font-family:inherit;
      background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);
      color:#cbd5e1; transition:background 0.2s,transform 0.15s;
    }
    .pg-btn:hover:not(:disabled){background:rgba(255,255,255,0.11);transform:translateY(-1px);}
    .pg-btn:disabled{opacity:.35;cursor:not-allowed;}
    .fi {
      width:100%; padding:10px 14px; box-sizing:border-box;
      background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
      border-radius:10px; color:#f1f5f9; font-size:14px; font-family:inherit; outline:none;
      transition:border-color 0.2s,box-shadow 0.2s;
    }
    .fi:focus{border-color:rgba(99,102,241,0.6);box-shadow:0 0 0 3px rgba(99,102,241,0.15);}
    .fi option{background:#1e1b4b;color:#f1f5f9;}
  `;
  document.head.appendChild(s);
};

const Tasks = () => {
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  }, []);
  const isAdmin = user?.role === 'Admin';

  const [rows, setRows]             = useState([]);
  const [page, setPage]             = useState(1);
  const [limit]                     = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [projects, setProjects]     = useState([]);
  const [creating, setCreating]     = useState(false);
  const [cTitle, setCTitle]         = useState('');
  const [cDesc, setCDesc]           = useState('');
  const [cProject, setCProject]     = useState('');
  const [cAssign, setCAssign]       = useState('');
  const [cStatus, setCStatus]       = useState('Todo');
  const [cDue, setCDue]             = useState('');

  const load = async (pg = page) => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/tasks', { params:{ page:pg, limit } });
      const p = res.data || {};
      setRows(p.data || []); setPage(p.page || pg); setTotalPages(p.totalPages || 1);
      if (isAdmin) {
        const pr = await api.get('/projects', { params:{ page:1, limit:500 } });
        setProjects(pr.data?.data || []);
      }
    } catch (e) { setError(e.response?.data?.message || 'Failed to load tasks.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { injectTaskStyles(); load(1); }, []); // eslint-disable-line

  const onStatusChange = async (id, status) => {
    setUpdatingId(id); setError('');
    try {
      await api.put(`/tasks/${id}`, { status });
      setRows(prev => prev.map(t => t._id === id ? {...t, status} : t));
    } catch (e) { setError(e.response?.data?.message || 'Failed to update.'); }
    finally { setUpdatingId(null); }
  };

  const onCreate = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!cTitle.trim() || !cDesc.trim() || !cProject.trim() || !cDue.trim()) {
      setError('Title, description, project, and due date are required.'); return;
    }
    setCreating(true); setError('');
    try {
      await api.post('/tasks', { title:cTitle.trim(), description:cDesc.trim(), projectId:cProject.trim(), assignedTo:cAssign.trim()||null, status:cStatus, dueDate:cDue.trim() });
      setCTitle(''); setCDesc(''); setCProject(''); setCAssign(''); setCStatus('Todo'); setCDue('');
      await load(1);
    } catch (e) { setError(e.response?.data?.message || 'Failed to create task.'); }
    finally { setCreating(false); }
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
            <h1 style={{ fontSize:'28px', fontWeight:'800', color:'#f1f5f9', margin:0, letterSpacing:'-0.4px' }}>Tasks</h1>
            <p style={{ color:'#64748b', margin:'4px 0 0', fontSize:'14px' }}>Page {page} of {totalPages}</p>
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            <button className="pg-btn" disabled={page<=1||loading} onClick={()=>load(page-1)}>← Prev</button>
            <button className="pg-btn" disabled={page>=totalPages||loading} onClick={()=>load(page+1)}>Next →</button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'12px', padding:'12px 16px', marginBottom:'20px', color:'#fca5a5', fontSize:'14px' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Create form (Admin only) */}
        {isAdmin && (
          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:'16px', padding:'24px', marginBottom:'24px' }}>
            <div style={{ fontWeight:'600', fontSize:'15px', color:'#e2e8f0', marginBottom:'16px' }}>➕ Create Task</div>
            <form onSubmit={onCreate} style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'12px' }}>
              <input className="fi" placeholder="Title" value={cTitle} onChange={e=>setCTitle(e.target.value)} />
              <input className="fi" placeholder="Due date (YYYY-MM-DD)" value={cDue} onChange={e=>setCDue(e.target.value)} />
              <input className="fi" placeholder="Description" value={cDesc} onChange={e=>setCDesc(e.target.value)} style={{gridColumn:'1/-1'}} />
              <select className="fi" value={cProject} onChange={e=>setCProject(e.target.value)}>
                <option value="">Select project</option>
                {projects.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
              <input className="fi" placeholder="Assign to (User ID, optional)" value={cAssign} onChange={e=>setCAssign(e.target.value)} />
              <select className="fi" value={cStatus} onChange={e=>setCStatus(e.target.value)}>
                {STATUS_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <div style={{gridColumn:'1/-1'}}>
                <button type="submit" disabled={creating} style={{ padding:'10px 24px', borderRadius:'10px', border:'none', cursor:'pointer', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontSize:'14px', fontWeight:'600', fontFamily:'inherit', opacity:creating?0.65:1, boxShadow:'0 4px 16px rgba(99,102,241,0.35)' }}>
                  {creating ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
            <p style={{ marginTop:'10px', fontSize:'12px', color:'#475569' }}>Assigned user must be a member of the selected project.</p>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', gap:'12px', color:'#94a3b8', fontSize:'15px', padding:'40px 0' }}>
            <div style={{ width:'20px', height:'20px', borderRadius:'50%', border:'2px solid rgba(99,102,241,0.3)', borderTopColor:'#6366f1', animation:'taskSpin 0.8s linear infinite' }}/>
            Loading tasks...
          </div>
        ) : (
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                  {['Title','Project','Status','Due Date'].map(h=>(
                    <th key={h} style={{ padding:'14px 20px', textAlign:'left', fontSize:'11px', fontWeight:'600', letterSpacing:'0.8px', textTransform:'uppercase', color:'#64748b' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding:'48px 20px', textAlign:'center', color:'#475569' }}>
                    <div style={{fontSize:'32px',marginBottom:'8px'}}>📭</div>No tasks found.
                  </td></tr>
                ) : rows.map((t, i) => {
                  const ss = STATUS_STYLE[t.status] || STATUS_STYLE['Todo'];
                  return (
                    <tr key={t._id} className="task-row" style={{ borderBottom:'1px solid rgba(255,255,255,0.05)', animationDelay:`${i*0.04}s` }}>
                      <td style={{ padding:'14px 20px', fontSize:'14px', fontWeight:'500', color:'#e2e8f0' }}>{t.title}</td>
                      <td style={{ padding:'14px 20px', fontSize:'13px', color:'#94a3b8' }}>{t.projectId?.name||'—'}</td>
                      <td style={{ padding:'14px 20px' }}>
                        <select className="status-sel" value={t.status} disabled={updatingId===t._id} onChange={e=>onStatusChange(t._id,e.target.value)} style={{ background:ss.bg, color:ss.color, borderColor:ss.border }}>
                          {STATUS_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={{ padding:'14px 20px', fontSize:'13px', color:'#64748b' }}>{formatDate(t.dueDate)}</td>
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
};

export default Tasks;
