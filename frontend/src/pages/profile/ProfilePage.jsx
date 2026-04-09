import { useEffect, useState } from 'react';
import { Camera, Save, User, Ruler, Palette, Eye, Scissors } from 'lucide-react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const SKIN_TONES = ['Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Dark', 'Deep'];
const EYE_COLORS = ['Black', 'Brown', 'Hazel', 'Green', 'Blue', 'Gray'];
const HAIR_COLORS = ['Black', 'Dark Brown', 'Light Brown', 'Blonde', 'Red', 'Gray', 'White', 'Colored'];

const FieldGroup = ({ title, icon: Icon, children }) => (
  <div className="card" style={{ padding: 24, marginBottom: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--card-border)' }}>
      <div style={{ width: 36, height: 36, background: 'rgba(51,51,204,0.08)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color="var(--accent)" />
      </div>
      <h3 style={{ fontWeight: 700, fontSize: 16 }}>{title}</h3>
    </div>
    {children}
  </div>
);

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    full_name: '', email: '', phone: '',
    height: '', weight: '',
    chest: '', waist: '', shoulder: '',
    skin_tone: '', eye_color: '', hair_color: '',
    profile_picture: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    api.get('/user/me')
      .then(res => {
        const data = res.data;
        setProfile(prev => ({ ...prev, ...data }));
        setAvatarPreview(data.profile_picture || null);
      })
      .catch(() => {
        // Fallback from localStorage
        const stored = localStorage.getItem('user');
        if (stored) try { setProfile(prev => ({ ...prev, ...JSON.parse(stored) })); } catch {}
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/user/update', profile);
      toast.success('Profile updated successfully! ✨');
    } catch { toast.error('Failed to save profile'); }
    finally { setSaving(false); }
  };

  const handleAvatarChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setProfile(prev => ({ ...prev, profile_picture: reader.result }));
      };
      reader.readAsDataURL(f);
    }
  };

  const initials = profile.full_name
    ? profile.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  if (loading) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="page-header"><div className="skeleton" style={{ height: 36, width: 200 }} /></div>
        {[1, 2, 3].map(i => (
          <div key={i} className="card" style={{ padding: 24, marginBottom: 20 }}>
            <div className="skeleton" style={{ height: 20, width: '30%', marginBottom: 20 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[1, 2, 3, 4].map(j => <div key={j} className="skeleton" style={{ height: 44 }} />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">User Profile</h1>
        <p className="page-subtitle">Manage your personal information and style preferences</p>
      </div>

      {/* Avatar section */}
      <div className="card animate-fade-in" style={{ padding: 28, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: avatarPreview ? 'transparent' : 'linear-gradient(135deg, #3333CC, #8844ee)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700, color: 'white', overflow: 'hidden',
            border: '3px solid rgba(51,51,204,0.2)',
          }}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : initials}
          </div>
          <label htmlFor="avatar-upload" style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 28, height: 28, background: 'var(--accent)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', border: '2px solid white',
          }}>
            <Camera size={13} color="white" />
          </label>
          <input id="avatar-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{profile.full_name || 'Your Name'}</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{profile.email}</div>
          <div className="badge badge-accent" style={{ marginTop: 8 }}>Style Member ✨</div>
        </div>
        <button
          id="save-profile"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ marginLeft: 'auto' }}
        >
          {saving ? 'Saving…' : <><Save size={15} /> Save Changes</>}
        </button>
      </div>

      {/* Basic info */}
      <FieldGroup title="Basic Information" icon={User}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Full Name</label>
            <input name="full_name" className="form-input" value={profile.full_name} onChange={handleChange} placeholder="Jane Doe" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email</label>
            <input name="email" className="form-input" value={profile.email} onChange={handleChange} placeholder="you@example.com" type="email" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Phone Number</label>
            <input name="phone" className="form-input" value={profile.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
          </div>
        </div>
      </FieldGroup>

      {/* Body measurements */}
      <FieldGroup title="Body Measurements" icon={Ruler}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { name: 'height', label: 'Height', placeholder: 'e.g. 170 cm' },
            { name: 'weight', label: 'Weight', placeholder: 'e.g. 65 kg' },
            { name: 'chest', label: 'Chest', placeholder: 'e.g. 90 cm' },
            { name: 'waist', label: 'Waist', placeholder: 'e.g. 75 cm' },
            { name: 'shoulder', label: 'Shoulder Width', placeholder: 'e.g. 42 cm' },
          ].map(({ name, label, placeholder }) => (
            <div key={name} className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{label}</label>
              <input name={name} className="form-input" value={profile[name]} onChange={handleChange} placeholder={placeholder} />
            </div>
          ))}
        </div>
      </FieldGroup>

      {/* Appearance */}
      <FieldGroup title="Appearance" icon={Palette}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Palette size={13} /> Skin Tone
            </label>
            <select name="skin_tone" className="form-input" value={profile.skin_tone} onChange={handleChange}>
              <option value="">Select…</option>
              {SKIN_TONES.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Eye size={13} /> Eye Color
            </label>
            <select name="eye_color" className="form-input" value={profile.eye_color} onChange={handleChange}>
              <option value="">Select…</option>
              {EYE_COLORS.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Scissors size={13} /> Hair Color
            </label>
            <select name="hair_color" className="form-input" value={profile.hair_color} onChange={handleChange}>
              <option value="">Select…</option>
              {HAIR_COLORS.map(c => <option key={c} value={c.toLowerCase().replace(' ', '_')}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Color swatches preview */}
        {profile.skin_tone && (
          <div style={{ marginTop: 20, padding: 16, background: 'rgba(51,51,204,0.04)', borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>YOUR APPEARANCE PROFILE</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'Skin', value: profile.skin_tone },
                { label: 'Eyes', value: profile.eye_color },
                { label: 'Hair', value: profile.hair_color },
              ].filter(i => i.value).map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{label}:</span>
                  <span style={{ textTransform: 'capitalize' }}>{value?.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </FieldGroup>

      <div style={{ textAlign: 'right', marginBottom: 40 }}>
        <button id="save-profile-bottom" className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '12px 32px', fontSize: 15 }}>
          {saving ? 'Saving…' : <><Save size={15} /> Save All Changes</>}
        </button>
      </div>
    </div>
  );
}
