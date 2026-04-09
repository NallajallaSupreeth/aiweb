import { useState } from 'react';
import { Settings, Bell, Shield, Palette, Globe, ToggleLeft, ToggleRight, Save } from 'lucide-react';
import toast from 'react-hot-toast';

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
      <h3 style={{ fontWeight: 700, fontSize: 16 }}>{title}</h3>
    </div>
    {children}
  </div>
);

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // Notifications
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
    outfitReminders: true,
    // Privacy
    dataSharing: false,
    analytics: true,
    // Appearance
    darkMode: false,
    compactView: false,
    // App
    autoRecommend: true,
    weatherOutfits: true,
    calendarSync: false,
  });

  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');

  const toggleSetting = (key) => (value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    toast.success('Settings saved successfully!');
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure? This action cannot be undone.')) {
      toast.error('Account deletion is not yet available');
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
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
          <button
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 13, color: 'var(--text-muted)' }}
          >
            Change Password →
          </button>
        </div>
      </SettingSection>

      {/* Appearance */}
      <SettingSection title="Appearance" icon={Palette}>
        <div style={{ marginBottom: 20 }}>
          <div className="form-label" style={{ marginBottom: 10 }}>Theme</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { id: 'light', label: '☀️ Light' },
              { id: 'dark', label: '🌙 Dark' },
              { id: 'system', label: '💻 System' },
            ].map(t => (
              <button
                key={t.id}
                id={`theme-${t.id}`}
                onClick={() => setTheme(t.id)}
                className={`btn btn-sm ${theme === t.id ? 'btn-primary' : 'btn-ghost'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divider" />

        <SettingRow
          label="Compact View"
          description="Show more items with a denser layout"
          value={settings.compactView}
          onChange={toggleSetting('compactView')}
        />
      </SettingSection>

      {/* App preferences */}
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

      {/* Danger zone */}
      <div className="card" style={{ padding: 24, marginBottom: 40, border: '1.5px solid rgba(239,68,68,0.2)' }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: '#ef4444', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          ⚠️ Danger Zone
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          These actions are irreversible. Please proceed with caution.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>
            Clear Wardrobe
          </button>
          <button id="delete-account" className="btn btn-danger btn-sm" onClick={handleDeleteAccount}>
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
