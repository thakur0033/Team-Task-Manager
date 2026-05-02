import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';

/* ─── Inject keyframes once ─── */
const injectLoginStyles = () => {
  if (document.getElementById('login-bg-styles')) return;
  const s = document.createElement('style');
  s.id = 'login-bg-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    @keyframes loginSpin   { to { transform: rotate(360deg); } }
    @keyframes floatA {
      0%,100% { transform: translate(0,0) scale(1); }
      40%     { transform: translate(60px,-80px) scale(1.12); }
      75%     { transform: translate(-40px,50px) scale(0.9); }
    }
    @keyframes floatB {
      0%,100% { transform: translate(0,0) scale(1); }
      33%     { transform: translate(-80px,60px) scale(1.1); }
      66%     { transform: translate(70px,-50px) scale(0.92); }
    }
    @keyframes floatC {
      0%,100% { transform: translate(0,0); }
      50%     { transform: translate(40px,70px); }
    }
    @keyframes meshShift {
      0%,100% { background-position: 0% 50%; }
      50%     { background-position: 100% 50%; }
    }
    @keyframes shapeFloat {
      0%,100% { transform: translateY(0) rotate(0deg); opacity:0.35; }
      50%     { transform: translateY(-28px) rotate(8deg); opacity:0.55; }
    }
    @keyframes loginCardIn {
      from { opacity:0; transform: translateY(20px); }
      to   { opacity:1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(s);
};

/* ─── Decorative floating shapes ─── */
const FloatingShapes = () => (
  <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:2 }}>
    {/* Large ring top-right */}
    <div style={{
      position:'absolute', top:'-60px', right:'-60px',
      width:'320px', height:'320px', borderRadius:'50%',
      border:'1.5px solid rgba(99,102,241,0.25)',
      animation:'shapeFloat 8s ease-in-out infinite',
    }}/>
    <div style={{
      position:'absolute', top:'-20px', right:'-20px',
      width:'220px', height:'220px', borderRadius:'50%',
      border:'1px solid rgba(139,92,246,0.2)',
      animation:'shapeFloat 11s ease-in-out infinite reverse',
    }}/>

    {/* Smaller ring bottom-left */}
    <div style={{
      position:'absolute', bottom:'-40px', left:'-40px',
      width:'260px', height:'260px', borderRadius:'50%',
      border:'1.5px solid rgba(99,102,241,0.2)',
      animation:'shapeFloat 10s ease-in-out infinite 2s',
    }}/>

    {/* Tiny sparkle dots */}
    {[
      { top:'15%', left:'8%',  size:'6px',  delay:'0s',   dur:'5s'  },
      { top:'72%', left:'88%', size:'5px',  delay:'1.5s', dur:'7s'  },
      { top:'40%', left:'92%', size:'8px',  delay:'0.8s', dur:'6s'  },
      { top:'85%', left:'15%', size:'6px',  delay:'2s',   dur:'8s'  },
      { top:'25%', left:'78%', size:'4px',  delay:'3s',   dur:'5.5s'},
    ].map((dot, i) => (
      <div key={i} style={{
        position:'absolute', top:dot.top, left:dot.left,
        width:dot.size, height:dot.size, borderRadius:'50%',
        background:'rgba(139,92,246,0.7)',
        boxShadow:`0 0 8px rgba(139,92,246,0.8)`,
        animation:`shapeFloat ${dot.dur} ease-in-out infinite ${dot.delay}`,
      }}/>
    ))}
  </div>
);

/* ══════════════════════════════════════════
   Main component
══════════════════════════════════════════ */
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';

  const [mode,     setMode]     = useState('login');
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    injectLoginStyles();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const trimmedName     = name.trim();
    const trimmedEmail    = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (mode === 'signup' && !trimmedName) { setError('Name is required.'); return; }
    if (!trimmedEmail || !trimmedPassword)  { setError('Email and password are required.'); return; }

    setLoading(true);
    try {
      const res = mode === 'signup'
        ? await api.post('/auth/signup', { name: trimmedName, email: trimmedEmail, password: trimmedPassword })
        : await api.post('/auth/login',  { email: trimmedEmail, password: trimmedPassword });

      const { token, name: resName, email: resEmail, role } = res.data || {};
      if (!token) throw new Error('Login response missing token');

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ name: resName, email: resEmail, role }));
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed.');
    } finally { setLoading(false); }
  };

  return (
    <div style={ls.page}>
      {/* ── Animated gradient base ── */}
      <div style={ls.gradBase} />

      {/* ── Morphing colour orbs ── */}
      <div style={ls.orbA} />
      <div style={ls.orbB} />
      <div style={ls.orbC} />

      {/* ── Diagonal grid ── */}
      <div style={ls.grid} />

      {/* ── Floating decorative shapes ── */}
      <FloatingShapes />

      {/* ── Card ── */}
      <div style={ls.card}>

        {/* Coloured top bar */}
        <div style={ls.topBar} />

        {/* Logo mark */}
        <div style={ls.logoRow}>
          <div style={ls.logoIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <span style={ls.logoText}>Team Task Manager</span>
        </div>

        <h1 style={ls.title}>
          {mode === 'signup' ? 'Create Account' : 'Welcome back'}
        </h1>
        <p style={ls.subtitle}>
          {mode === 'signup' ? 'Join your team today' : 'Sign in to your workspace'}
        </p>

        {error && (
          <div style={ls.errorBox}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:1}}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} style={ls.form}>
          {mode === 'signup' && (
            <div style={ls.field}>
              <label style={ls.label}>Full Name</label>
              <input
                type="text"
                placeholder="Jane Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                style={ls.input}
                onFocus={(e) => Object.assign(e.target.style, ls.inputFocus)}
                onBlur={(e)  => Object.assign(e.target.style, ls.inputBlur)}
              />
            </div>
          )}

          <div style={ls.field}>
            <label style={ls.label}>Email</label>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              style={ls.input}
              onFocus={(e) => Object.assign(e.target.style, ls.inputFocus)}
              onBlur={(e)  => Object.assign(e.target.style, ls.inputBlur)}
            />
          </div>

          <div style={ls.field}>
            <label style={ls.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={ls.input}
              onFocus={(e) => Object.assign(e.target.style, ls.inputFocus)}
              onBlur={(e)  => Object.assign(e.target.style, ls.inputBlur)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={loading ? {...ls.submitBtn, opacity:0.65, cursor:'not-allowed'} : ls.submitBtn}
          >
            {loading
              ? <span style={ls.spinRow}><span style={ls.spinner}/>
                  {mode === 'signup' ? 'Creating...' : 'Signing in...'}
                </span>
              : mode === 'signup' ? 'Create Account' : 'Sign In'
            }
          </button>
        </form>

        <div style={ls.footer}>
          <span style={ls.footerText}>
            {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
          </span>
          <button
            type="button"
            style={ls.switchBtn}
            onClick={() => { setError(''); setMode(m => m === 'login' ? 'signup' : 'login'); }}
          >
            {mode === 'signup' ? 'Back to login' : 'Create new one'}
          </button>
        </div>

        {mode === 'login' && (
          <div style={ls.adminLinkRow}>
            <Link to="/admin-login" style={ls.adminLink}>Admin Portal →</Link>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Styles ─── */
const ls = {
  page: {
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: "'Inter','Segoe UI',sans-serif",
  },

  /* background layers */
  gradBase: {
    position: 'absolute', inset: 0, zIndex: 0,
    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #1e3a5f 55%, #0f172a 100%)',
    backgroundSize: '300% 300%',
    animation: 'meshShift 14s ease infinite',
  },
  orbA: {
    position: 'absolute', zIndex: 1, pointerEvents: 'none',
    top: '-200px', right: '-100px',
    width: '580px', height: '580px', borderRadius: '50%',
    background: 'radial-gradient(circle at 40% 40%, rgba(99,102,241,0.5) 0%, rgba(139,92,246,0.25) 45%, transparent 70%)',
    filter: 'blur(40px)',
    animation: 'floatA 16s ease-in-out infinite',
  },
  orbB: {
    position: 'absolute', zIndex: 1, pointerEvents: 'none',
    bottom: '-180px', left: '-120px',
    width: '520px', height: '520px', borderRadius: '50%',
    background: 'radial-gradient(circle at 60% 60%, rgba(59,130,246,0.45) 0%, rgba(99,102,241,0.2) 50%, transparent 72%)',
    filter: 'blur(36px)',
    animation: 'floatB 20s ease-in-out infinite',
  },
  orbC: {
    position: 'absolute', zIndex: 1, pointerEvents: 'none',
    top: '30%', left: '35%',
    width: '300px', height: '300px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(168,85,247,0.22) 0%, transparent 70%)',
    filter: 'blur(50px)',
    animation: 'floatC 25s ease-in-out infinite',
  },
  grid: {
    position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
    backgroundImage:
      'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
    backgroundSize: '48px 48px',
  },

  /* card */
  card: {
    position: 'relative', zIndex: 10,
    width: '100%', maxWidth: '420px',
    background: 'rgba(255,255,255,0.96)',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.2)',
    animation: 'loginCardIn 0.45s cubic-bezier(0.22,1,0.36,1) both',
  },
  topBar: {
    height: '5px',
    background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #3b82f6)',
  },

  /* inside card */
  logoRow: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '28px 36px 0',
  },
  logoIcon: {
    width: '36px', height: '36px', borderRadius: '10px',
    background: 'linear-gradient(135deg,#eef2ff,#ede9fe)',
    border: '1px solid #e0e7ff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(99,102,241,0.2)',
  },
  logoText: { fontSize: '14px', fontWeight: '600', color: '#312e81' },

  title: {
    fontSize: '24px', fontWeight: '700', color: '#0f172a',
    margin: '20px 36px 4px', letterSpacing: '-0.3px',
  },
  subtitle: { fontSize: '13.5px', color: '#64748b', margin: '0 36px 24px' },

  errorBox: {
    display: 'flex', alignItems: 'flex-start', gap: '8px',
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: '10px', padding: '10px 14px',
    margin: '0 36px 16px', fontSize: '13px', color: '#b91c1c',
  },

  form: { display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 36px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#374151' },
  input: {
    width: '100%', padding: '11px 14px',
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px', color: '#0f172a', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
  },
  inputFocus: {
    borderColor: '#6366f1',
    boxShadow: '0 0 0 3px rgba(99,102,241,0.14)',
    background: '#fff',
  },
  inputBlur: {
    borderColor: '#e2e8f0',
    boxShadow: 'none',
    background: '#f8fafc',
  },

  submitBtn: {
    marginTop: '4px', padding: '13px',
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    border: 'none', borderRadius: '10px',
    color: '#fff', fontSize: '15px', fontWeight: '600',
    cursor: 'pointer', letterSpacing: '0.2px',
    boxShadow: '0 4px 18px rgba(99,102,241,0.4)',
    transition: 'opacity 0.2s, transform 0.15s',
  },
  spinRow: { display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' },
  spinner: {
    width:'16px', height:'16px',
    border:'2px solid rgba(255,255,255,0.35)', borderTopColor:'#fff',
    borderRadius:'50%', display:'inline-block',
    animation:'loginSpin 0.7s linear infinite',
  },

  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px 36px 0', fontSize: '13.5px',
  },
  footerText: { color: '#64748b' },
  switchBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#6366f1', fontWeight: '600', fontSize: '13.5px',
    padding: 0,
  },

  adminLinkRow: { padding: '14px 36px 28px', textAlign: 'center' },
  adminLink: {
    fontSize: '12px', color: '#94a3b8',
    textDecoration: 'none', transition: 'color 0.2s',
  },
};

export default Login;
