import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Plus, Sparkles, Shirt,
  TrendingUp, CalendarDays, Lightbulb, X
} from 'lucide-react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

// ─── CALENDAR ─────────────────────────────────────────────────────────────────
function CalendarSection() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', description: '' });
  const [googleConnected, setGoogleConnected] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  // Check Google connection status + handle redirect callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleParam = params.get('google');

    if (googleParam === 'connected') {
      toast.success('Google Calendar connected! 🎉');
      // Clean URL
      window.history.replaceState({}, '', '/dashboard');
    } else if (googleParam === 'error') {
      toast.error('Google Calendar connection failed. Try again.');
      window.history.replaceState({}, '', '/dashboard');
    }

    // Check if already connected
    api.get('/calendar/status')
      .then(r => {
        setGoogleConnected(r.data?.connected || false);
        if (r.data?.connected) {
          // Fetch real events
          api.get('/calendar/events')
            .then(r2 => setEvents(r2.data?.events || []))
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const handleConnectGoogle = async () => {
    setConnectingGoogle(true);
    try {
      const res = await api.get('/calendar/connect');
      const authUrl = res.data?.auth_url;
      if (authUrl) {
        // Open Google OAuth in the same tab
        window.location.href = authUrl;
      }
    } catch {
      toast.error('Failed to start Google connection');
      setConnectingGoogle(false);
    }
  };

  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date?.startsWith(dateStr) || e.start?.dateTime?.startsWith(dateStr));
  };

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.date) { toast.error('Title and date required'); return; }
    if (!googleConnected) {
      toast.error('Please connect Google Calendar first');
      return;
    }
    try {
      await api.post('/calendar/add-event', newEvent);
      toast.success('✅ Event added to Google Calendar!');
      setShowAddEvent(false);
      setNewEvent({ title: '', date: '', description: '' });
      // Refresh events
      api.get('/calendar/events').then(r => setEvents(r.data?.events || [])).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add event');
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CalendarDays size={20} color="var(--accent)" />
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Calendar</h2>
          {/* Google connection status badge */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 600,
            background: googleConnected ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            color: googleConnected ? '#16a34a' : '#ef4444',
            border: `1px solid ${googleConnected ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: googleConnected ? '#22c55e' : '#ef4444', display: 'inline-block' }} />
            {googleConnected ? 'Google Connected' : 'Not Connected'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', minWidth: 140, textAlign: 'center' }}>
            {monthName} {year}
          </span>
          <button className="btn btn-icon btn-ghost" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
            <ChevronLeft size={16} />
          </button>
          <button className="btn btn-icon btn-ghost" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
            <ChevronRight size={16} />
          </button>
          <button className="btn btn-primary btn-sm" id="add-event-btn" onClick={() => setShowAddEvent(true)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plus size={14} /> Add Event
          </button>
        </div>
      </div>

      {/* Google Connect Banner — shown when not connected */}
      {!googleConnected && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'linear-gradient(135deg, rgba(51,51,204,0.06), rgba(136,68,238,0.06))',
          border: '1px solid rgba(51,51,204,0.15)',
          borderRadius: 10,
          marginBottom: 16,
          gap: 12,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>📅</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                Connect Google Calendar
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Sync your events and add new ones directly to Google Calendar
              </div>
            </div>
          </div>
          <button
            id="connect-google-calendar"
            onClick={handleConnectGoogle}
            disabled={connectingGoogle}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px',
              background: 'white',
              border: '1.5px solid rgba(51,51,204,0.3)',
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 13,
              color: 'var(--accent)',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {connectingGoogle ? (
              '⏳ Connecting…'
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Connect Google Calendar
              </>
            )}
          </button>
        </div>
      )}

      {/* Week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
        {weekDays.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {blanks.map(i => <div key={`blank-${i}`} />)}
        {days.map(day => {
          const dayEvents = getEventsForDay(day);
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const isSelected = selectedDay === day;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day === selectedDay ? null : day)}
              style={{
                aspectRatio: '1',
                border: 'none',
                borderRadius: 8,
                background: isToday
                  ? 'linear-gradient(135deg, #3333CC, #8844ee)'
                  : isSelected
                  ? 'rgba(51,51,204,0.1)'
                  : 'transparent',
                color: isToday ? 'white' : isSelected ? 'var(--accent)' : 'var(--text-primary)',
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                fontWeight: isToday ? 700 : 400,
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                padding: '6px 2px',
              }}
            >
              {day}
              {dayEvents.length > 0 && (
                <div style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: isToday ? 'rgba(255,255,255,0.6)' : 'var(--accent)',
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day events */}
      {selectedDay && (
        <div style={{ marginTop: 16, padding: 16, background: 'rgba(51,51,204,0.04)', borderRadius: 10, border: '1px solid rgba(51,51,204,0.08)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
            Events on {monthName} {selectedDay}
          </div>
          {getEventsForDay(selectedDay).length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No events. Enjoy your free day! 🎉</p>
          ) : (
            getEventsForDay(selectedDay).map((ev, i) => (
              <div key={i} style={{
                padding: '8px 12px', background: 'white', borderRadius: 8,
                border: '1px solid rgba(51,51,204,0.1)', marginBottom: 6, fontSize: 13,
              }}>
                <div style={{ fontWeight: 600 }}>{ev.summary || ev.title}</div>
                {ev.description && <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>{ev.description}</div>}
                {ev.start?.dateTime && (
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>
                    🕐 {new Date(ev.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Add event modal */}
      {showAddEvent && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
        }}>
          <div className="card animate-scale-in" style={{ width: 420, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>New Calendar Event</h3>
                {googleConnected && (
                  <p style={{ fontSize: 12, color: '#16a34a', marginTop: 2 }}>
                    ✅ Will be saved to Google Calendar
                  </p>
                )}
                {!googleConnected && (
                  <p style={{ fontSize: 12, color: '#ef4444', marginTop: 2 }}>
                    ⚠️ Connect Google Calendar to save events
                  </p>
                )}
              </div>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowAddEvent(false)}><X size={16} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Event Title</label>
              <input className="form-input" placeholder="e.g. Business Meeting" value={newEvent.title}
                onChange={e => setNewEvent(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Date & Time</label>
              <input className="form-input" type="datetime-local" value={newEvent.date}
                onChange={e => setNewEvent(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <input className="form-input" placeholder="Add details…" value={newEvent.description}
                onChange={e => setNewEvent(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowAddEvent(false)}>Cancel</button>
              <button
                id="add-event-confirm"
                className="btn btn-primary"
                onClick={handleAddEvent}
                disabled={!googleConnected}
                style={{ opacity: googleConnected ? 1 : 0.5 }}
              >
                Add to Google Calendar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── OUTFIT CARD ───────────────────────────────────────────────────────────────
function OutfitCard({ item, index }) {
  const navigate = useNavigate();
  const colors = ['#3333CC', '#8844ee', '#22c55e', '#f59e0b', '#ef4444'];
  const categoryEmoji = {
    top: '👕', bottom: '👖', dress: '👗', shoes: '👟', accessories: '💎', outerwear: '🧥',
  };

  return (
    <div
      className="card card-interactive animate-fade-in"
      style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', animationDelay: `${index * 0.06}s`, animationFillMode: 'both' }}
      onClick={() => navigate('/wardrobe')}
    >
      <div style={{
        height: 120,
        background: `linear-gradient(135deg, ${colors[index % colors.length]}22, ${colors[(index + 2) % colors.length]}22)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        {item.image_url ? (
          <img
            src={item.image_url.startsWith('/') ? item.image_url : `/${item.image_url}`}
            alt={item.category}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <span style={{ fontSize: 40 }}>{categoryEmoji[item.category?.toLowerCase()] || '👗'}</span>
        )}
        <div className="badge badge-accent" style={{ position: 'absolute', top: 10, right: 10 }}>
          {item.category || 'Item'}
        </div>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          {item.category || 'Clothing Item'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {item.color && (
            <div style={{
              width: 12, height: 12, borderRadius: '50%',
              background: item.color.toLowerCase() === 'white' ? '#f0f0f0' : item.color,
              border: '1px solid rgba(0,0,0,0.1)',
            }} />
          )}
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.color || 'Mixed'}</span>
        </div>
      </div>
    </div>
  );
}

// ─── STAT CARD ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <div className="card animate-fade-in" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'center', animationDelay: delay, animationFillMode: 'both' }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [wardrobe, setWardrobe] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/wardrobe').then(r => setWardrobe(r.data?.wardrobe || [])).catch(() => {});
  }, []);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
  })();

  const stats = [
    { icon: Shirt, label: 'Wardrobe Items', value: wardrobe.length, color: '#3333CC', delay: '0s' },
    { icon: TrendingUp, label: 'Outfits Generated', value: 12, color: '#8844ee', delay: '0.05s' },
    { icon: Sparkles, label: 'Style Score', value: '92%', color: '#22c55e', delay: '0.1s' },
  ];

  return (
    <div>
      {/* Welcome header */}
      <div className="page-header animate-fade-in">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>Good {getGreeting()},</span>
          <span className="gradient-text">{user.full_name?.split(' ')[0] || 'Stylist'}</span>
          <span>✨</span>
        </h1>
        <p className="page-subtitle">Here's your fashion summary for today</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <CalendarSection />

          {/* Outfit Recommendations */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Shirt size={20} color="var(--accent)" />
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Your Wardrobe</h2>
              </div>
              <button className="btn btn-secondary btn-sm" id="view-all-wardrobe" onClick={() => navigate('/wardrobe')}>
                View All →
              </button>
            </div>
            {wardrobe.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Shirt size={28} /></div>
                <div>
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>No wardrobe items yet</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Upload your first clothing item to get AI recommendations
                  </p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/upload')}>
                  Upload Clothing
                </button>
              </div>
            ) : (
              <div className="grid-cards">
                {wardrobe.slice(0, 6).map((item, i) => (
                  <OutfitCard key={item._id} item={item} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Style Tip */}
          <div className="card animate-fade-in delay-3" style={{ padding: 24, background: 'linear-gradient(135deg, #3333CC 0%, #8844ee 100%)', border: 'none', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Lightbulb size={18} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15 }}>Daily Style Tip</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, opacity: 0.9 }}>
              "Neutral tones are the building blocks of a versatile wardrobe. Mix and match beige, grey, and navy to create effortless daily looks."
            </p>
            <div style={{
              marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', gap: 8,
            }}>
              <span style={{ fontSize: 11, opacity: 0.7, fontWeight: 600 }}>PALETTE</span>
              {['#F5F0E8', '#9B9B9B', '#2C3E6B'].map(c => (
                <div key={c} style={{ width: 20, height: 20, borderRadius: '50%', background: c, border: '2px solid rgba(255,255,255,0.4)' }} />
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card animate-fade-in delay-4" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: '📤 Upload new clothing', to: '/upload' },
                { label: '⭐ Get recommendations', to: '/recommendations' },
                { label: '🧠 Take style quiz', to: '/quiz' },
                { label: '👤 Update profile', to: '/profile' },
              ].map(({ label, to }) => (
                <button
                  key={to}
                  className="btn btn-ghost"
                  style={{ justifyContent: 'flex-start', fontSize: 13, textAlign: 'left' }}
                  onClick={() => navigate(to)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Wardrobe breakdown */}
          {wardrobe.length > 0 && (
            <div className="card animate-fade-in delay-5" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Wardrobe Breakdown</h3>
              {Object.entries(
                wardrobe.reduce((acc, item) => {
                  const cat = item.category || 'Other';
                  acc[cat] = (acc[cat] || 0) + 1;
                  return acc;
                }, {})
              ).map(([cat, count]) => (
                <div key={cat} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{cat}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{count}</span>
                  </div>
                  <div style={{ height: 6, background: '#f0ecf5', borderRadius: 100 }}>
                    <div style={{
                      height: '100%',
                      width: `${(count / wardrobe.length) * 100}%`,
                      background: 'linear-gradient(90deg, #3333CC, #8844ee)',
                      borderRadius: 100,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
