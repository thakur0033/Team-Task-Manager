import { useEffect, useState } from 'react';
import api from '../services/api';

/* ── inject styles once ── */
const injectDashStyles = () => {
  if (document.getElementById('dash-styles')) return;
  const s = document.createElement('style');
  s.id = 'dash-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    @keyframes dashFloatA {
      0%,100% { transform: translate(0,0) scale(1); }
      50%      { transform: translate(60px,-50px) scale(1.08); }
    }
    @keyframes dashFloatB {
      0%,100% { transform: translate(0,0) scale(1); }
      50%      { transform: translate(-50px,60px) scale(1.1); }
    }
    @keyframes countUp {
      from { opacity:0; transform: translateY(12px); }
      to   { opacity:1; transform: translateY(0); }
    }
    @keyframes statCardIn {
      from { opacity:0; transform: translateY(20px); }
      to   { opacity:1; transform: translateY(0); }
    }
    @keyframes pulseRing {
      0%   { transform:scale(1);   opacity:0.6; }
      100% { transform:scale(1.6); opacity:0; }
    }
    .stat-card {
      position: relative;
      border-radius: 18px;
      padding: 28px 24px;
      overflow: hidden;
      cursor: default;
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s;
      animation: statCardIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
    }
    .stat-card:hover {
      transform: translateY(-5px) scale(1.02);
    }
  `;
  document.head.appendChild(s);
};

const STAT_CONFIG = [
  {
    key: 'total', label: 'Total Tasks', icon: '📋',
    gradient: 'linear-gradient(135deg,#1e1b4b,#2d2a6e)',
    accent: '#6366f1', border: 'rgba(99,102,241,0.3)',
    glow: 'rgba(99,102,241,0.25)', delay: '0s',
  },
  {
    key: 'completed', label: 'Completed', icon: '✅',
    gradient: 'linear-gradient(135deg,#052e16,#14532d)',
    accent: '#22c55e', border: 'rgba(34,197,94,0.3)',
    glow: 'rgba(34,197,94,0.2)', delay: '0.08s',
  },
  {
    key: 'pending', label: 'Pending', icon: '⏳',
    gradient: 'linear-gradient(135deg,#1c1003,#431407)',
    accent: '#f59e0b', border: 'rgba(245,158,11,0.3)',
    glow: 'rgba(245,158,11,0.2)', delay: '0.16s',
  },
  {
    key: 'overdue', label: 'Overdue', icon: '🔥',
    gradient: 'linear-gradient(135deg,#1a0505,#450a0a)',
    accent: '#ef4444', border: 'rgba(239,68,68,0.3)',
    glow: 'rgba(239,68,68,0.2)', delay: '0.24s',
  },
];

const StatCard = ({ conf, value }) => (
  <div
    className="stat-card"
    style={{
      background: conf.gradient,
      border: `1px solid ${conf.border}`,
      boxShadow: `0 8px 32px ${conf.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
      animationDelay: conf.delay,
    }}
  >
    {/* Glow orb top-right */}
    <div style={{
      position: 'absolute', top: '-30px', right: '-30px',
      width: '120px', height: '120px', borderRadius: '50%',
      background: `radial-gradient(circle, ${conf.glow} 0%, transparent 70%)`,
      pointerEvents: 'none',
    }} />

    {/* Icon */}
    <div style={{
      fontSize: '28px', lineHeight: 1, marginBottom: '16px',
      filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.2))',
    }}>
      {conf.icon}
    </div>

    {/* Value */}
    <div style={{
      fontSize: '42px', fontWeight: '800', color: '#f8fafc',
      lineHeight: 1, marginBottom: '8px', letterSpacing: '-1px',
      animation: 'countUp 0.6s cubic-bezier(0.22,1,0.36,1) both',
      animationDelay: conf.delay,
      fontFamily: "'Inter','Segoe UI',sans-serif",
    }}>
      {value}
    </div>

    {/* Label */}
    <div style={{
      fontSize: '13px', fontWeight: '500',
      color: conf.accent, letterSpacing: '0.3px', textTransform: 'uppercase',
    }}>
      {conf.label}
    </div>

    {/* Bottom accent line */}
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px',
      background: `linear-gradient(90deg, ${conf.accent}, transparent)`,
      borderRadius: '0 0 18px 18px',
    }} />
  </div>
);

const Dashboard = () => {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  })();

  useEffect(() => {
    injectDashStyles();
    const load = async () => {
      setLoading(true); setError('');
      try {
        const res = await api.get('/tasks/dashboard');
        setStats(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard.');
      } finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      background: 'linear-gradient(145deg,#06040f 0%,#0d0920 45%,#060b18 100%)',
      fontFamily: "'Inter','Segoe UI',sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{
        position:'absolute', top:'-200px', right:'-150px',
        width:'600px', height:'600px', borderRadius:'50%',
        background:'radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)',
        filter:'blur(40px)', animation:'dashFloatA 18s ease-in-out infinite',
        pointerEvents:'none',
      }}/>
      <div style={{
        position:'absolute', bottom:'-150px', left:'-100px',
        width:'500px', height:'500px', borderRadius:'50%',
        background:'radial-gradient(circle,rgba(139,92,246,0.1) 0%,transparent 70%)',
        filter:'blur(40px)', animation:'dashFloatB 22s ease-in-out infinite',
        pointerEvents:'none',
      }}/>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px', position:'relative', zIndex:1 }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px' }}>
            <div style={{
              width:'8px', height:'8px', borderRadius:'50%',
              background:'#22c55e', boxShadow:'0 0 8px #22c55e',
            }}/>
            <span style={{ fontSize:'13px', color:'#64748b', fontWeight:'500', letterSpacing:'0.5px', textTransform:'uppercase' }}>
              Live Overview
            </span>
          </div>
          <h1 style={{ fontSize:'32px', fontWeight:'800', color:'#f1f5f9', margin:0, letterSpacing:'-0.5px' }}>
            Welcome back{user?.name ? `, ${user.name}` : ''}! 👋
          </h1>
          <p style={{ color:'#64748b', marginTop:'6px', fontSize:'15px' }}>
            Here's what's happening with your team's tasks today.
          </p>
        </div>

        {error && (
          <div style={{
            display:'flex', alignItems:'center', gap:'10px',
            background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)',
            borderRadius:'12px', padding:'12px 16px', marginBottom:'24px',
            color:'#fca5a5', fontSize:'14px',
          }}>
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div style={{ display:'flex', alignItems:'center', gap:'14px', color:'#94a3b8', fontSize:'15px' }}>
            <div style={{
              width:'20px', height:'20px',
              border:'2px solid rgba(99,102,241,0.3)', borderTopColor:'#6366f1',
              borderRadius:'50%', animation:'dashSpin 0.8s linear infinite',
            }}/>
            Loading dashboard...
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',
              gap:'20px', marginBottom:'40px',
            }}>
              {STAT_CONFIG.map(conf => (
                <StatCard key={conf.key} conf={conf} value={stats?.[conf.key] ?? 0} />
              ))}
            </div>

            {/* Summary bar */}
            {stats && (stats.total ?? 0) > 0 && (
              <div style={{
                background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.08)',
                borderRadius:'16px', padding:'24px 28px',
              }}>
                <div style={{ fontSize:'13px', color:'#64748b', fontWeight:'500',
                              letterSpacing:'0.4px', textTransform:'uppercase', marginBottom:'14px' }}>
                  Completion Progress
                </div>
                <div style={{
                  height:'10px', borderRadius:'10px',
                  background:'rgba(255,255,255,0.06)',
                  overflow:'hidden', marginBottom:'10px',
                }}>
                  <div style={{
                    height:'100%',
                    width:`${Math.round(((stats.completed ?? 0) / (stats.total ?? 1)) * 100)}%`,
                    background:'linear-gradient(90deg,#6366f1,#22c55e)',
                    borderRadius:'10px',
                    transition:'width 1s cubic-bezier(0.22,1,0.36,1)',
                  }}/>
                </div>
                <div style={{ fontSize:'13px', color:'#94a3b8' }}>
                  {stats.completed ?? 0} of {stats.total ?? 0} tasks completed —{' '}
                  <span style={{ color:'#a78bfa', fontWeight:'600' }}>
                    {Math.round(((stats.completed ?? 0) / (stats.total ?? 1)) * 100)}%
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
