import { useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, X, CheckCircle, Loader } from 'lucide-react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

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
      toast.success('Clothing uploaded successfully! 👗');
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
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Upload Clothing</h1>
        <p className="page-subtitle">Add new items to your AI-powered wardrobe</p>
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
              <img
                src={preview}
                alt="Preview"
                style={{ width: '100%', maxHeight: 360, objectFit: 'contain', display: 'block' }}
              />
              <button
                className="btn btn-icon btn-danger"
                style={{ position: 'absolute', top: 12, right: 12 }}
                onClick={(e) => { e.stopPropagation(); handleClear(); }}
              >
                <X size={16} />
              </button>
              {file && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'rgba(26,26,46,0.75)', color: 'white',
                  padding: '10px 16px', fontSize: 13,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <ImageIcon size={14} />
                  <span>{file.name}</span>
                  <span style={{ marginLeft: 'auto', opacity: 0.6 }}>
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 72, height: 72,
                background: 'linear-gradient(135deg, rgba(51,51,204,0.1), rgba(136,68,238,0.1))',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Upload size={28} color="var(--accent)" />
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Drop your image here
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  or <span style={{ color: 'var(--accent)', fontWeight: 600 }}>browse to upload</span>
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  Supports JPG, PNG, WEBP · Max 10MB
                </p>
              </div>
            </div>
          )}
        </div>

        <input
          id="file-input"
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files?.[0])}
        />

        {/* Category */}
        <div className="form-group" style={{ marginTop: 24 }}>
          <label className="form-label" htmlFor="category-input">
            Category <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional — AI will auto-detect)</span>
          </label>
          <select
            id="category-input"
            className="form-input"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="">Auto-detect (recommended)</option>
            {['top', 'bottom', 'dress', 'shoes', 'accessories', 'outerwear', 'other'].map(c => (
              <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* AI info banner */}
        <div style={{
          padding: '12px 16px', background: 'rgba(51,51,204,0.06)',
          borderRadius: 10, border: '1px solid rgba(51,51,204,0.12)',
          fontSize: 13, color: 'var(--text-secondary)',
          display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20,
        }}>
          <span style={{ fontSize: 18 }}>🧠</span>
          <span>
            Our AI will automatically <strong>detect category, color, and pattern</strong> using computer vision,
            and generate embeddings for style matching.
          </span>
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

        {/* Success result */}
        {uploaded && (
          <div className="card animate-scale-in" style={{ marginTop: 24, padding: 20, border: '1px solid rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <CheckCircle size={20} color="#22c55e" />
              <span style={{ fontWeight: 700, fontSize: 15, color: '#16a34a' }}>Upload Successful!</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Category', value: uploaded.category },
                { label: 'Color', value: uploaded.color },
                { label: 'Pattern', value: uploaded.pattern },
                { label: 'Occasion', value: uploaded.occasion },
                { label: 'Season', value: uploaded.season },
              ].filter(r => r.value).map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{value}</div>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 16 }} onClick={handleClear}>
              Upload another item
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
