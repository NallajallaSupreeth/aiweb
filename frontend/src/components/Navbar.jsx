import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Cloud, Sun, CloudRain, Thermometer, User, LogOut, Sparkles, Bell } from 'lucide-react';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

const WeatherIcon = ({ condition }) => {
  const c = condition?.toLowerCase() || '';
  if (c.includes('rain') || c.includes('drizzle')) return <CloudRain size={16} />;
  if (c.includes('cloud')) return <Cloud size={16} />;
  return <Sun size={16} />;
};

export default function Navbar({ sidebarWidth }) {
  const navigate = useNavigate();
  const [weather, setWeather] = useState(null);
  const [userName, setUserName] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    // Load user info
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUserName(JSON.parse(stored)?.full_name || ''); } catch {}
    }

    // Fetch weather by geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        // Reverse geo to city name using a public API
        try {
          const { latitude, longitude } = pos.coords;
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const geoData = await geoRes.json();
          const city =
            geoData.address?.city ||
            geoData.address?.town ||
            geoData.address?.village ||
            'Mumbai';
          const res = await api.get(`/weather/${city}`);
          setWeather({ city, ...res.data });
        } catch {
          // fallback silently
        }
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = userName
    ? userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header style={{
      height: 'var(--navbar-height)',
      background: 'rgba(255,255,255,0.9)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(51,51,204,0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Left: title + breadcrumb-like */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={20} color="var(--accent)" />
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: 'var(--text-primary)',
          }}>
            Intelligent Personal Stylist
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Weather */}
        {weather && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            background: 'rgba(51,51,204,0.06)',
            borderRadius: 100,
            border: '1px solid rgba(51,51,204,0.12)',
            color: 'var(--accent)',
            fontSize: 13,
            fontWeight: 500,
          }}>
            <WeatherIcon condition={weather.condition || weather.description} />
            <span>{weather.city}</span>
            {weather.temperature && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: 'var(--text-secondary)' }}>
                <Thermometer size={13} />
                {Math.round(weather.temperature)}°C
              </span>
            )}
          </div>
        )}

        {/* Notification bell */}
        <button className="btn btn-icon btn-ghost" style={{ position: 'relative' }} id="navbar-notifications">
          <Bell size={18} />
          <span style={{
            position: 'absolute', top: 6, right: 6,
            width: 7, height: 7, background: '#ef4444',
            borderRadius: '50%', border: '2px solid white',
          }} />
        </button>

        {/* Profile */}
        <div style={{ position: 'relative' }}>
          <button
            id="navbar-profile"
            onClick={() => setShowProfileMenu(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'none',
              border: '1.5px solid rgba(51,51,204,0.2)',
              borderRadius: 100,
              padding: '4px 12px 4px 4px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              width: 32, height: 32,
              background: 'linear-gradient(135deg, #3333CC, #8844ee)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 13, fontWeight: 700,
            }}>
              {initials}
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userName || 'Profile'}
            </span>
          </button>

          {/* Dropdown */}
          {showProfileMenu && (
            <div
              className="card animate-scale-in"
              style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                minWidth: 180,
                padding: 8,
                zIndex: 200,
              }}
              onMouseLeave={() => setShowProfileMenu(false)}
            >
              <Link
                to="/profile"
                onClick={() => setShowProfileMenu(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8,
                  color: 'var(--text-primary)', fontSize: 14,
                  textDecoration: 'none',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(51,51,204,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <User size={16} />
                My Profile
              </Link>
              <div className="divider" style={{ margin: '4px 0' }} />
              <button
                id="navbar-logout"
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8,
                  color: '#ef4444', fontSize: 14,
                  background: 'none', border: 'none', cursor: 'pointer', width: '100%',
                  transition: 'background 0.2s', fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
