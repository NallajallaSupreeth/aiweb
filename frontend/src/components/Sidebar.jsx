import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Shirt, Upload, User, Brain, Star, Settings,
  ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';

const navItems = [
  { to: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/wardrobe',        icon: Shirt,           label: 'Wardrobe' },
  { to: '/upload',          icon: Upload,          label: 'Upload Clothing' },
  { to: '/profile',         icon: User,            label: 'User Profile' },
  { to: '/quiz',            icon: Brain,           label: 'Style Quiz' },
  { to: '/recommendations', icon: Star,            label: 'Recommendations' },
  { to: '/settings',        icon: Settings,        label: 'Settings' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate();

  return (
    <aside
      style={{
        width: collapsed ? '72px' : 'var(--sidebar-width)',
        background: 'var(--sidebar-bg)',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
      }}
    >
      {/* Brand — clicking navigates to dashboard */}
      <div
        onClick={() => navigate('/dashboard')}
        style={{
          padding: collapsed ? '24px 0' : '24px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          minHeight: 'var(--navbar-height)',
          flexShrink: 0,
          cursor: 'pointer',
        }}
      >
        <div style={{
          width: 36, height: 36,
          background: 'linear-gradient(135deg, #3333CC, #8844ee)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(51,51,204,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <Sparkles size={18} color="white" />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: 'white', fontSize: 14, whiteSpace: 'nowrap' }}>
              Intelligent
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 400, color: 'rgba(255,255,255,0.5)', fontSize: 12, whiteSpace: 'nowrap' }}>
              Personal Stylist
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: collapsed ? '11px 0' : '11px 14px',
              borderRadius: 10,
              color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
              background: isActive
                ? 'linear-gradient(135deg, rgba(51,51,204,0.7), rgba(136,68,238,0.5))'
                : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              justifyContent: collapsed ? 'center' : 'flex-start',
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              position: 'relative',
            })}
            className="sidebar-nav-link"
          >
            <Icon size={18} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{label}</span>}
            {collapsed && (
              <span style={{
                position: 'absolute',
                left: '110%',
                background: '#1a1a2e',
                color: 'white',
                padding: '6px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                opacity: 0,
                transition: 'opacity 0.2s ease',
                zIndex: 200,
                border: '1px solid rgba(255,255,255,0.1)',
              }} className="sidebar-tooltip">{label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div style={{ padding: '16px 8px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button
          onClick={onToggle}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 10,
            padding: collapsed ? '10px 0' : '10px 14px',
            background: 'rgba(255,255,255,0.05)',
            border: 'none',
            borderRadius: 8,
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: "'Inter', sans-serif",
            transition: 'all 0.2s ease',
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>

      <style>{`
        .sidebar-nav-link:hover {
          background: rgba(255,255,255,0.07) !important;
          color: white !important;
        }
        .sidebar-nav-link:hover .sidebar-tooltip {
          opacity: 1 !important;
        }
      `}</style>
    </aside>
  );
}
