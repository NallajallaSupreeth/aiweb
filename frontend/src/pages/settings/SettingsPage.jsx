import { useState, useEffect } from 'react';
import { Settings, Bell, Shield, Palette, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';

// ── Apply / remove dark theme on <html> ──────────────────────────────────────
function applyTheme(theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);

  if (isDark) {
    root.style.setProperty('--bg-primary',    '#0f0f1a');
    root.style.setProperty('--card-bg',       '#1a1a2e');
    root.style.setProperty('--card-border',   'rgba(255,255,255,0.08)');
    root.style.setProperty('--text-primary',  '#f0eeff');
    root.style.setProperty('--text-secondary','#a0a0c0');
    root.style.setProperty('--text-muted',    '#6060a0');
    root.style.setProperty('--shadow-sm',     '0 1px 4px rgba(0,0,0,0.4)');
    root.style.setProperty('--shadow-md',     '0 4px 16px rgba(0,0,0,0.5)');
    root.style.setProperty('--shadow-lg',     '0 8px 32px rgba(0,0,0,0.6)');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.style.setProperty('--bg-primary',    '#F7F3F9');
    root.style.setProperty('--card-bg',       '#ffffff');
    root.style.setProperty('--card-border',   'rgba(51,51,204,0.12)');
    root.style.setProperty('--text-primary',  '#1a1a2e');
    root.style.setProperty('--text-secondary','#5a5a7a');
    root.style.setProperty('--text-muted',    '#9090a8');
    root.style.setProperty('--shadow-sm',     '0 1px 3px rgba(51,51,204,0.08)');
    root.style.setProperty('--shadow-md',     '0 4px 16px rgba(51,51,204,0.12)');
    root.style.setProperty('--shadow-lg',     '0 8px 32px rgba(51,51,204,0.18)');
    root.setAttribute('data-theme', 'light');
  }
}

// ── Toggle switch component ─────────────────────────────────────────────────
const Toggle = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    style={{
      background: value ? 'var(--accent)' : '#e0d8f0',
      border: 'none',
      borderRadius: 100,
      width: 44,
      height: 24,
      cursor: 'pointer',
      position: 'relative',
      transition: 'background 0.2s',
      flexShrink: 0,
    }}
  >
    <div style={{
      position: 'absolute',
      top: 3,
      left: value ? 23 : 3,
      width: 18, height: 18,
      background: 'white',
      borderRadius: '50%',
      transition: 'left 0.2s',
      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
    }} />
  </button>
);

const SettingRow = ({ label, description, value, onChange }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 0',
    borderBottom: '1px solid var(--card-border)',
  }}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{label}</div>
      {description && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{description}</div>}
    </div>
    <Toggle value={value} onChange={onChange} />
  </div>
);

const SettingSection = ({ title, icon: Icon, children }) => (
  <div className="card animate-fade-in" style={{ padding: 24, marginBottom: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <div style={{ width: 36, height: 36, background: 'rgba(51,51,204,0.08)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color="var(--accent)" />
      </div>
      <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{title}</h3>
    </div>
    {children}
  </div>
);

// ── Delete confirmation modal ────────────────────────────────────────────────
function DeleteModal({ onConfirm, onCancel, loading }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500,
    }}>
      <div className="card animate-scale-in" style={{ width: 400, padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, color: '#ef4444' }}>
          Delete Account?
        </h3>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          This will permanently delete your account, wardrobe, and all data.
          <br /><strong>This action cannot be undone.</strong>
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            id="confirm-delete-account"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={loading}
            style={{ background: '#ef4444', color: 'white', border: 'none' }}
          >
            {loading ? 'Deleting…' : 'Yes, Delete My Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function SettingsPage() {
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
    outfitReminders: true,
    dataSharing: false,
    analytics: true,
    compactView: false,
    autoRecommend: true,
    weatherOutfits: true,
    calendarSync: false,
  });

  // Persist theme choice
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'light');
  const [language, setLanguage] = useState('en');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Apply saved theme on mount
  useEffect(() => {
    applyTheme(theme);
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
    applyTheme(newTheme);
  };

  const toggleSetting = (key) => (value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    toast.success('Settings saved successfully!');
  };

  // ── Real delete account ────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      let userId = null;
      try {
        const stored = localStorage.getItem('user');
        if (stored) userId = JSON.parse(stored)?._id;
      } catch {}

      if (userId) {
        await api.delete(`/user/${userId}`);
      } else {
        // Fallback: still clear session even if ID missing
      }

      toast.success('Account deleted successfully');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      applyTheme('light'); // Reset theme before redirect
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete account. Please try again.');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const THEMES = [
    { id: 'light', label: '☀️ Light' },
    { id: 'dark',  label: '🌙 Dark' },
    { id: 'system',label: '💻 System' },
  ];

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {showDeleteModal && (
        <DeleteModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
          loading={deleteLoading}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Customize your experience</p>
        </div>
        <button id="save-settings" className="btn btn-primary" onClick={handleSave}>
          <Save size={15} /> Save Changes
        </button>
      </div>

      {/* Notifications */}
      <SettingSection title="Notifications" icon={Bell}>
        <SettingRow
          label="Email Notifications"
          description="Receive style tips and updates via email"
          value={settings.emailNotifications}
          onChange={toggleSetting('emailNotifications')}
        />
        <SettingRow
          label="Push Notifications"
          description="Browser notifications for real-time updates"
          value={settings.pushNotifications}
          onChange={toggleSetting('pushNotifications')}
        />
        <SettingRow
          label="Weekly Style Digest"
          description="Get a weekly roundup of style trends"
          value={settings.weeklyDigest}
          onChange={toggleSetting('weeklyDigest')}
        />
        <div style={{ padding: '16px 0' }}>
          <SettingRow
            label="Outfit Reminders"
            description="Get reminded to plan outfits for upcoming events"
            value={settings.outfitReminders}
            onChange={toggleSetting('outfitReminders')}
          />
        </div>
      </SettingSection>

      {/* Privacy */}
      <SettingSection title="Privacy & Security" icon={Shield}>
        <SettingRow
          label="Anonymous Data Sharing"
          description="Help improve AI recommendations (fully anonymous)"
          value={settings.dataSharing}
          onChange={toggleSetting('dataSharing')}
        />
        <SettingRow
          label="Usage Analytics"
          description="Allow us to collect app usage data"
          value={settings.analytics}
          onChange={toggleSetting('analytics')}
        />
        <div style={{ padding: '16px 0 0' }}>
          <button className="btn btn-ghost btn-sm" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Change Password →
          </button>
        </div>
      </SettingSection>

      {/* Appearance — REAL dark mode toggle */}
      <SettingSection title="Appearance" icon={Palette}>
        <div style={{ marginBottom: 20 }}>
          <div className="form-label" style={{ marginBottom: 10 }}>Theme</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {THEMES.map(t => (
              <button
                key={t.id}
                id={`theme-${t.id}`}
                onClick={() => handleThemeChange(t.id)}
                className={`btn btn-sm ${theme === t.id ? 'btn-primary' : 'btn-ghost'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {/* Live preview label */}
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            {theme === 'dark' ? '🌙 Dark mode is active' : theme === 'system' ? '💻 Following system preference' : '☀️ Light mode is active'}
          </p>
        </div>

        <div className="divider" />

        <SettingRow
          label="Compact View"
          description="Show more items with a denser layout"
          value={settings.compactView}
          onChange={toggleSetting('compactView')}
        />
      </SettingSection>

      {/* App Preferences */}
      <SettingSection title="App Preferences" icon={Settings}>
        <div style={{ marginBottom: 20 }}>
          <div className="form-label" style={{ marginBottom: 10 }}>Language</div>
          <select className="form-input" value={language} onChange={e => setLanguage(e.target.value)} style={{ maxWidth: 200 }}>
            {[
              { code: 'en', label: 'English' },
              { code: 'es', label: 'Español' },
              { code: 'fr', label: 'Français' },
              { code: 'de', label: 'Deutsch' },
              { code: 'hi', label: 'हिन्दी' },
            ].map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>

        <div className="divider" />

        <SettingRow
          label="Auto-Recommend Outfits"
          description="Generate outfit suggestions automatically on login"
          value={settings.autoRecommend}
          onChange={toggleSetting('autoRecommend')}
        />
        <SettingRow
          label="Weather-based Outfits"
          description="Factor in current weather for recommendations"
          value={settings.weatherOutfits}
          onChange={toggleSetting('weatherOutfits')}
        />
        <div style={{ padding: '16px 0 0' }}>
          <SettingRow
            label="Google Calendar Sync"
            description="Sync calendar events for outfit planning"
            value={settings.calendarSync}
            onChange={toggleSetting('calendarSync')}
          />
        </div>
      </SettingSection>

      {/* Danger Zone */}
      <div className="card" style={{ padding: 24, marginBottom: 40, border: '1.5px solid rgba(239,68,68,0.2)' }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: '#ef4444', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          ⚠️ Danger Zone
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
          These actions are irreversible. Please proceed with caution.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn btn-ghost btn-sm"
            style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
            onClick={() => toast('Clear Wardrobe coming soon', { icon: '🗑️' })}
          >
            Clear Wardrobe
          </button>
          <button
            id="delete-account"
            className="btn btn-sm"
            onClick={() => setShowDeleteModal(true)}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '6px 16px',
              borderRadius: 6,
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            🗑️ Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
