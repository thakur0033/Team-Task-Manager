import { NavLink, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

/* ── inject styles once ── */
const injectNavStyles = () => {
  if (document.getElementById('nav-styles')) return;
  const s = document.createElement('style');
  s.id = 'nav-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    .nav-link-item {
      position: relative; padding: 6px 2px;
      font-size: 14px; font-weight: 500;
      color: rgba(203,213,225,0.8);
      text-decoration: none;
      transition: color 0.2s;
    }
    .nav-link-item::after {
      content: ''; position: absolute; bottom: -2px; left: 0; right: 0;
      height: 2px; border-radius: 2px;
      background: linear-gradient(90deg,#6366f1,#8b5cf6);
      transform: scaleX(0); transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
    }
    .nav-link-item:hover { color: #f1f5f9; }
    .nav-link-item.active { color: #a78bfa; }
    .nav-link-item.active::after { transform: scaleX(1); }
    .logout-btn {
      padding: 7px 16px; border-radius: 8px; border: none; cursor: pointer;
      font-size: 13.5px; font-weight: 600; font-family: inherit;
      background: linear-gradient(135deg,#6366f1,#8b5cf6);
      color: #fff; letter-spacing: 0.2px;
      box-shadow: 0 2px 12px rgba(99,102,241,0.35);
      transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    }
    .logout-btn:hover { opacity:0.88; transform:translateY(-1px); box-shadow: 0 4px 16px rgba(99,102,241,0.45); }
  `;
  document.head.appendChild(s);
};

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/projects',  label: 'Projects'  },
  { to: '/tasks',     label: 'Tasks'     },
];

const Navbar = () => {
  const navigate = useNavigate();
  injectNavStyles();

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav style={{
      background: 'rgba(10,8,28,0.92)',
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
      borderBottom: '1px solid rgba(139,92,246,0.18)',
      boxShadow: '0 1px 24px rgba(0,0,0,0.4)',
      position: 'sticky', top: 0, zIndex: 100,
      fontFamily: "'Inter','Segoe UI',sans-serif",
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '9px',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(99,102,241,0.4)',
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                   stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <span style={{ fontWeight: '700', fontSize: '15px', color: '#f1f5f9', letterSpacing: '-0.2px' }}>
              Team Task Manager
            </span>
          </div>

          {/* Nav links + right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link-item${isActive ? ' active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}

            {/* Role badge */}
            {user?.role && (
              <span style={{
                padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                background: user.role === 'Admin'
                  ? 'linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.2))'
                  : 'rgba(255,255,255,0.07)',
                border: user.role === 'Admin'
                  ? '1px solid rgba(167,139,250,0.4)'
                  : '1px solid rgba(255,255,255,0.12)',
                color: user.role === 'Admin' ? '#a78bfa' : '#94a3b8',
                letterSpacing: '0.3px',
              }}>
                {user.role}
              </span>
            )}

            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
