import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';

/* ─── Inject all keyframes once ─── */
const injectStyles = () => {
  if (document.getElementById('admin-bg-styles')) return;
  const s = document.createElement('style');
  s.id = 'admin-bg-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    @keyframes spin       { to { transform: rotate(360deg); } }
    @keyframes orb1move   {
      0%,100% { transform: translate(0,0) scale(1); }
      33%     { transform: translate(80px,-60px) scale(1.15); }
      66%     { transform: translate(-50px,80px) scale(0.88); }
    }
    @keyframes orb2move   {
      0%,100% { transform: translate(0,0) scale(1); }
      40%     { transform: translate(-90px,70px) scale(1.2); }
      75%     { transform: translate(60px,-80px) scale(0.9); }
    }
    @keyframes orb3move   {
      0%,100% { transform: translate(0,0) scale(1); }
      50%     { transform: translate(100px,60px) scale(1.1); }
    }
    @keyframes gridFade   {
      0%,100% { opacity: 0.06; }
      50%     { opacity: 0.13; }
    }
    @keyframes scanline   {
      0%   { transform: translateY(-100%); }
      100% { transform: translateY(200vh); }
    }
    @keyframes cardIn {
      from { opacity:0; transform: translateY(24px) scale(0.97); }
      to   { opacity:1; transform: translateY(0) scale(1); }
    }
  `;
  document.head.appendChild(s);
};

/* ─── Particle canvas ─── */
const ParticleCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let W, H;

    const PARTICLE_COUNT = 90;
    const CONNECTION_DIST = 130;
    const particles = [];

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.6 + 0.5,
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      /* connections */
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const opacity = (1 - dist / CONNECTION_DIST) * 0.18;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(139,92,246,${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      /* dots */
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167,139,250,${p.alpha})`;
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 1,
      }}
    />
  );
};

/* ══════════════════════════════════════════
   Main component
══════════════════════════════════════════ */
const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [showPwd,     setShowPwd]     = useState(false);

  useEffect(() => {
    injectStyles();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const em = email.trim().toLowerCase();
    const pw = password.trim();
    if (!em || !pw) { setError('Email and password are required.'); return; }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: em, password: pw });
      const { token, name, email: resEmail, role } = res.data || {};
      if (!token) throw new Error('Missing token');
      if (role !== 'Admin') {
        setError('Access denied. This portal is for Admins only.');
        return;
      }
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ name, email: resEmail, role }));
      navigate(from, { replace: true });
    } catch (err) {
      if (err.message === 'Access denied. This portal is for Admins only.') {
        setError(err.message);
      } else {
        setError(err.response?.data?.message || 'Invalid admin credentials.');
      }
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      {/* ── Layered animated background ── */}

      {/* Deep gradient base */}
      <div style={s.gradientBase} />

      {/* Dot grid */}
      <div style={s.dotGrid} />

      {/* Morphing colour orbs */}
      <div style={s.orb1} />
      <div style={s.orb2} />
      <div style={s.orb3} />

      {/* Slow scan-line shimmer */}
      <div style={s.scanline} />

      {/* Particle network canvas */}
      <ParticleCanvas />

      {/* ── Card ── */}
      <div style={s.card}>
        <div style={s.iconWrapper}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
               stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        <h1 style={s.title}>Admin Portal</h1>
        <p  style={s.subtitle}>Restricted access — Admins only</p>

        {error && (
          <div style={s.errorBox}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} style={s.form}>
          {/* Email */}
          <div style={s.field}>
            <label style={s.label}>Admin Email</label>
            <div style={s.inputWrap}>
              <svg style={s.inputIcon} width="15" height="15" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input
                id="admin-email"
                type="email"
                placeholder="admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                style={s.input}
                onFocus={(e) => Object.assign(e.target.style, s.inputFocus)}
                onBlur={(e)  => Object.assign(e.target.style, s.inputBlur)}
              />
            </div>
          </div>

          {/* Password */}
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <div style={s.inputWrap}>
              <svg style={s.inputIcon} width="15" height="15" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                id="admin-password"
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{ ...s.input, paddingRight: '44px' }}
                onFocus={(e) => Object.assign(e.target.style, s.inputFocus)}
                onBlur={(e)  => Object.assign(e.target.style, s.inputBlur)}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)} style={s.eyeBtn} tabIndex={-1}>
                {showPwd
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                }
              </button>
            </div>
          </div>

          <button
            id="admin-login-btn"
            type="submit"
            disabled={loading}
            style={loading ? { ...s.submitBtn, opacity: 0.65, cursor: 'not-allowed' } : s.submitBtn}
          >
            {loading
              ? <span style={s.spinRow}><span style={s.spinner}/>Authenticating...</span>
              : 'Sign in as Admin'
            }
          </button>
        </form>

        <div style={s.footer}>
          <span style={s.footerText}>Not an admin?</span>
          <Link to="/login" style={s.footerLink}>Member login →</Link>
        </div>
      </div>
    </div>
  );
};

/* ─── Styles ─── */
const s = {
  /* ── Page shell ── */
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

  /* ── Background layers ── */
  gradientBase: {
    position: 'absolute', inset: 0, zIndex: 0,
    background: 'linear-gradient(125deg, #06040f 0%, #0d0920 30%, #100d2e 60%, #060b18 100%)',
  },
  dotGrid: {
    position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
    backgroundImage:
      'radial-gradient(circle, rgba(148,130,255,0.55) 1px, transparent 1px)',
    backgroundSize: '36px 36px',
    animation: 'gridFade 6s ease-in-out infinite',
  },
  orb1: {
    position: 'absolute', zIndex: 2, pointerEvents: 'none',
    top: '-180px', right: '-120px',
    width: '600px', height: '600px', borderRadius: '50%',
    background:
      'radial-gradient(circle at 40% 40%, rgba(99,102,241,0.45) 0%, rgba(139,92,246,0.2) 50%, transparent 72%)',
    filter: 'blur(30px)',
    animation: 'orb1move 14s ease-in-out infinite',
  },
  orb2: {
    position: 'absolute', zIndex: 2, pointerEvents: 'none',
    bottom: '-160px', left: '-140px',
    width: '560px', height: '560px', borderRadius: '50%',
    background:
      'radial-gradient(circle at 60% 60%, rgba(168,85,247,0.4) 0%, rgba(99,102,241,0.18) 50%, transparent 72%)',
    filter: 'blur(28px)',
    animation: 'orb2move 18s ease-in-out infinite',
  },
  orb3: {
    position: 'absolute', zIndex: 2, pointerEvents: 'none',
    top: '35%', left: '20%',
    width: '340px', height: '340px', borderRadius: '50%',
    background:
      'radial-gradient(circle, rgba(56,189,248,0.18) 0%, transparent 70%)',
    filter: 'blur(40px)',
    animation: 'orb3move 22s ease-in-out infinite',
  },
  scanline: {
    position: 'absolute', zIndex: 3, pointerEvents: 'none',
    top: 0, left: 0, right: 0,
    height: '200px',
    background:
      'linear-gradient(to bottom, transparent, rgba(139,92,246,0.04), transparent)',
    animation: 'scanline 9s linear infinite',
  },

  /* ── Card ── */
  card: {
    position: 'relative', zIndex: 10,
    width: '100%', maxWidth: '420px',
    background: 'rgba(15,10,35,0.65)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(139,92,246,0.22)',
    borderRadius: '22px',
    padding: '42px 38px',
    boxShadow:
      '0 30px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 1px rgba(99,102,241,0.08)',
    animation: 'cardIn 0.5s cubic-bezier(0.22,1,0.36,1) both',
  },

  iconWrapper: {
    width: '54px', height: '54px', borderRadius: '16px',
    background: 'linear-gradient(135deg,rgba(99,102,241,0.28),rgba(139,92,246,0.16))',
    border: '1px solid rgba(167,139,250,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '20px',
    boxShadow: '0 0 28px rgba(99,102,241,0.25)',
  },
  title: {
    fontSize: '26px', fontWeight: '700',
    color: '#f1f5f9', margin: '0 0 6px', letterSpacing: '-0.3px',
  },
  subtitle: { fontSize: '13.5px', color: '#94a3b8', margin: '0 0 28px' },

  errorBox: {
    display: 'flex', alignItems: 'flex-start', gap: '8px',
    background: 'rgba(239,68,68,0.12)',
    border: '1px solid rgba(239,68,68,0.28)',
    borderRadius: '10px', padding: '10px 14px',
    marginBottom: '20px', fontSize: '13px', color: '#fca5a5',
  },

  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  field: { display: 'flex', flexDirection: 'column', gap: '7px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#cbd5e1', letterSpacing: '0.2px' },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '14px', color: '#64748b', pointerEvents: 'none' },

  input: {
    width: '100%', padding: '12px 14px 12px 40px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', color: '#f1f5f9', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
  },
  inputFocus: {
    borderColor: 'rgba(139,92,246,0.7)',
    boxShadow: '0 0 0 3px rgba(139,92,246,0.2)',
    background: 'rgba(255,255,255,0.08)',
  },
  inputBlur: {
    borderColor: 'rgba(255,255,255,0.1)',
    boxShadow: 'none',
    background: 'rgba(255,255,255,0.05)',
  },
  eyeBtn: {
    position: 'absolute', right: '12px',
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#64748b', padding: '4px', lineHeight: 0,
  },

  submitBtn: {
    marginTop: '6px', padding: '13px',
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    border: 'none', borderRadius: '10px',
    color: '#fff', fontSize: '15px', fontWeight: '600',
    cursor: 'pointer', letterSpacing: '0.2px',
    boxShadow: '0 4px 24px rgba(99,102,241,0.45)',
    transition: 'opacity 0.2s, transform 0.15s',
  },
  spinRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  spinner: {
    width: '16px', height: '16px',
    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
    borderRadius: '50%', display: 'inline-block',
    animation: 'spin 0.7s linear infinite',
  },

  footer: {
    marginTop: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    fontSize: '13.5px',
  },
  footerText: { color: '#64748b' },
  footerLink: { color: '#a78bfa', textDecoration: 'none', fontWeight: '500' },
};

export default AdminLogin;
