import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password || !form.confirm_password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (form.password !== form.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/signup', {
        full_name: form.full_name,
        phone: form.phone,
        email: form.email,
        password: form.password,
      });
      toast.success('Account created! Please sign in 🎉');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Signup failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'full_name', label: 'Full Name', type: 'text', icon: User, placeholder: 'Jane Doe', required: true },
    { name: 'phone', label: 'Phone Number', type: 'tel', icon: Phone, placeholder: '+1 (555) 000-0000', required: false },
    { name: 'email', label: 'Email Address', type: 'email', icon: Mail, placeholder: 'you@example.com', required: true },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F7F3F9 0%, #ede8f5 50%, #e0d8f0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '-20%', right: '-10%',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(51,51,204,0.12) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 480, padding: 40, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, #3333CC, #8844ee)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(51,51,204,0.3)',
          }}>
            <Sparkles size={26} color="white" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            Create your account
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Start your AI-powered style journey
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {fields.map(({ name, label, type, icon: Icon, placeholder, required }) => (
            <div className="form-group" key={name}>
              <label className="form-label" htmlFor={`signup-${name}`}>
                {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
              </label>
              <div className="form-input-icon">
                <Icon size={16} className="input-icon" />
                <input
                  id={`signup-${name}`}
                  name={name}
                  type={type}
                  className="form-input"
                  placeholder={placeholder}
                  value={form[name]}
                  onChange={handleChange}
                />
              </div>
            </div>
          ))}

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">
              Password <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div className="form-input-icon" style={{ position: 'relative' }}>
              <Lock size={16} className="input-icon" />
              <input
                id="signup-password"
                name="password"
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange}
                style={{ paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPass(v => !v)} style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0,
              }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-confirm">
              Confirm Password <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div className="form-input-icon">
              <Lock size={16} className="input-icon" />
              <input
                id="signup-confirm"
                name="confirm_password"
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="Re-enter password"
                value={form.confirm_password}
                onChange={handleChange}
              />
            </div>
            {form.confirm_password && form.password !== form.confirm_password && (
              <span style={{ fontSize: 12, color: '#ef4444' }}>Passwords do not match</span>
            )}
          </div>

          <button
            id="signup-submit"
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: 8, fontSize: 15 }}
          >
            {loading ? 'Creating account…' : <>Create Account <ArrowRight size={16} /></>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
