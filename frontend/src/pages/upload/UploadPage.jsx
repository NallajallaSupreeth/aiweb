import { useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, X, CheckCircle, Loader, Sparkles } from 'lucide-react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const CATEGORY_OPTIONS = [
  { value: '', label: 'Auto-detect (recommended)'},
  { value: 'topwear', label: 'Topwear (shirts, t-shirts, hoodies)' },
  { value: 'bottomwear', label: 'Bottomwear (jeans, trousers, shorts)' },
  { value: 'footwear', label: 'Footwear (shoes, boots, sandals)' },
  { value: 'outerwear', label: 'Outerwear (coats, jackets)' },
  { value: 'accessories', label: 'Accessories (bags, watches, caps)' },
];

// ── Result field renderer ─────────────────────────────────────────────────────
function ResultField({ label, value, color }) {
  if (!value || value === 'unknown') return null;
  return (
    <div style={{
      background: 'rgba(51,51,204,0.04)',
      border: '1px solid rgba(51,51,204,0.1)',
      borderRadius: 10,
      padding: '12px 14px',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {color && (
          <div style={{
            width: 18, height: 18, borderRadius: '50%',
            background: color,
            border: '2px solid rgba(0,0,0,0.1)',
            flexShrink: 0,
          }} title={color} />
        )}
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
          {value}
        </span>
      </div>
    </div>
  );
}

// ── Tag badge ─────────────────────────────────────────────────────────────────
function Tag({ text }) {
  if (!text) return null;
  return (
    <span style={{
      padding: '4px 10px',
      background: 'rgba(51,51,204,0.08)',
      color: 'var(--accent)',
      borderRadius: 100,
      fontSize: 12,
      fontWeight: 600,
      textTransform: 'capitalize',
    }}>
      {text}
    </span>
  );
}

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB'); return; }
    setFile(f);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(f);
    setUploaded(null);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, []);

  const handleUpload = async () => {
    if (!file) { toast.error('Please select an image first'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (category) formData.append('category', category);

      const res = await api.post('/wardrobe/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploaded(res.data?.item);
      toast.success('✅ Clothing analyzed and saved!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setUploaded(null);
    setCategory('');
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Upload Clothing</h1>
        <p className="page-subtitle">Add new items — AI will detect category, color, style, and more</p>
      </div>

      <div className="card animate-fade-in" style={{ padding: 32 }}>
        {/* Drop zone */}
        <div
          id="upload-dropzone"
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragging ? 'var(--accent)' : 'rgba(51,51,204,0.25)'}`,
            borderRadius: 16,
            background: dragging ? 'rgba(51,51,204,0.04)' : '#fafafe',
            padding: preview ? 0 : 48,
            textAlign: 'center',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            overflow: 'hidden',
            position: 'relative',
          }}
          onClick={() => !preview && document.getElementById('file-input').click()}
        >
          {preview ? (
            <div style={{ position: 'relative' }}>
              <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: 380, objectFit: 'contain', display: 'block' }} />
              <button className="btn btn-icon btn-danger" style={{ position: 'absolute', top: 12, right: 12 }} onClick={(e) => { e.stopPropagation(); handleClear(); }}>
                <X size={16} />
              </button>
              {file && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(26,26,46,0.75)', color: 'white', padding: '10px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ImageIcon size={14} />
                  <span>{file.name}</span>
                  <span style={{ marginLeft: 'auto', opacity: 0.6 }}>{(file.size / 1024).toFixed(0)} KB</span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg, rgba(51,51,204,0.1), rgba(136,68,238,0.1))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={28} color="var(--accent)" />
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Drop your image here</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>or <span style={{ color: 'var(--accent)', fontWeight: 600 }}>browse to upload</span></p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Supports JPG, PNG, WEBP · Max 10MB</p>
              </div>
            </div>
          )}
        </div>

        <input id="file-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0])} />

        {/* Category override */}
        <div className="form-group" style={{ marginTop: 24, marginBottom: 16 }}>
          <label className="form-label" htmlFor="category-input">
            Category <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional — AI auto-detects)</span>
          </label>
          <select id="category-input" className="form-input" value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* AI capabilities banner */}
        <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, rgba(51,51,204,0.05), rgba(136,68,238,0.05))', borderRadius: 10, border: '1px solid rgba(51,51,204,0.12)', fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 20 }}>
          <Sparkles size={18} color="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong style={{ color: 'var(--accent)' }}>AI Vision Analysis</strong> detects:
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {['Category', 'Subcategory', 'Style', 'Dominant Color', 'Color Hex', 'Pattern', 'Material', 'Season', 'Occasion'].map(t => (
                <Tag key={t} text={t} />
              ))}
            </div>
          </div>
        </div>

        {/* Upload button */}
        <button
          id="upload-submit"
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={loading || !file}
          style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15 }}
        >
          {loading ? (
            <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Uploading & Analyzing…</>
          ) : (
            <><Upload size={16} /> Upload to Wardrobe</>
          )}
        </button>
      </div>

      {/* Success result card */}
      {uploaded && (
        <div className="card animate-scale-in" style={{ marginTop: 24, padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, background: 'rgba(34,197,94,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={22} color="#22c55e" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#16a34a' }}>Upload & Analysis Complete!</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>AI detected the following clothing attributes</div>
            </div>
          </div>

          {/* Color showcase */}
          {uploaded.color_hex && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'rgba(51,51,204,0.03)', borderRadius: 12, border: '1px solid rgba(51,51,204,0.08)', marginBottom: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: uploaded.color_hex, border: '2px solid rgba(0,0,0,0.12)', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', textTransform: 'capitalize', marginBottom: 2 }}>
                  {uploaded.color}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {uploaded.color_hex} · {uploaded.color_rgb}
                </div>
              </div>
            </div>
          )}

          {/* All attributes grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <ResultField label="Main Category" value={uploaded.category} />
            <ResultField label="Subcategory" value={uploaded.subcategory} />
            <ResultField label="Style / Type" value={uploaded.style} />
            <ResultField label="Pattern" value={uploaded.pattern} />
            <ResultField label="Material" value={uploaded.material} />
            <ResultField label="Occasion" value={uploaded.occasion} />
            <ResultField label="Season" value={uploaded.season} />
          </div>

          {/* Tags row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            {[uploaded.category, uploaded.subcategory, uploaded.style, uploaded.pattern, uploaded.occasion].filter(Boolean).map((t, i) => (
              <Tag key={i} text={t} />
            ))}
          </div>

          <button className="btn btn-ghost btn-sm" style={{ marginTop: 20 }} onClick={handleClear}>
            + Upload Another Item
          </button>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
