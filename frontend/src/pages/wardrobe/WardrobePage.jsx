import { useEffect, useState } from 'react';
import { Shirt, Trash2, Edit3, X, Search, Filter, RefreshCw } from 'lucide-react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const CATEGORY_EMOJI = {
  topwear: '👕', bottomwear: '👖', footwear: '👟',
  outerwear: '🧥', accessories: '💎', dress: '👗', other: '🎽',
  // legacy
  top: '👕', bottom: '👖', shoes: '👟',
};

const FIELD_OPTIONS = {
  category:    ['topwear', 'bottomwear', 'footwear', 'outerwear', 'accessories', 'dress', 'other'],
  subcategory: ['t-shirt', 'shirt', 'hoodie', 'sweater', 'tank top', 'jacket', 'kurta', 'crop top', 'blouse',
                'jeans', 'chinos', 'trousers', 'cargo pants', 'joggers', 'shorts', 'skirt', 'leggings',
                'sneakers', 'boots', 'loafers', 'sandals', 'formal shoes', 'heels',
                'coat', 'blazer', 'cap', 'bag', 'watch', 'belt', 'scarf', 'sunglasses'],
  style:       ['casual', 'formal', 'ethnic', 'sporty', 'streetwear', 'denim', 'cargo', 'joggers',
                'graphic', 'oversized', 'slim', 'vintage', 'boho', 'luxury', 'minimalist'],
  pattern:     ['solid', 'striped', 'checked', 'floral', 'graphic', 'camo', 'polka dots', 'abstract', 'printed'],
  material:    ['cotton', 'denim', 'polyester', 'linen', 'leather', 'wool', 'silk', 'fleece', 'rayon', 'nylon'],
  season:      ['all-season', 'summer', 'winter', 'monsoon'],
  occasion:    ['casual', 'formal', 'ethnic', 'party', 'sport', 'work', 'all'],
};

// ── Attribute pill ────────────────────────────────────────────────────────────
function Pill({ text, color }) {
  if (!text || text === 'unknown') return null;
  return (
    <span style={{
      padding: '3px 8px', borderRadius: 100,
      fontSize: 10, fontWeight: 700,
      background: color || 'rgba(51,51,204,0.08)',
      color: color ? 'white' : 'var(--accent)',
      textTransform: 'capitalize', lineHeight: 1.4,
    }}>{text}</span>
  );
}

// ── Full Edit Modal ─────────────────────────────────────────────────────────
function EditModal({ item, onSave, onClose }) {
  const [form, setForm] = useState({
    category:    item.category    || 'topwear',
    subcategory: item.subcategory || '',
    style:       item.style       || '',
    color:       item.color       || '',
    color_hex:   item.color_hex   || '',
    pattern:     item.pattern     || 'solid',
    material:    item.material    || '',
    season:      item.season      || 'all-season',
    occasion:    item.occasion    || 'casual',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(item._id, form);
    setSaving(false);
    onClose();
  };

  const SelectField = ({ label, field, options, allowText }) => (
    <div className="form-group" style={{ margin: 0 }}>
      <label className="form-label" style={{ fontSize: 11, marginBottom: 5 }}>{label}</label>
      {allowText ? (
        <input className="form-input" style={{ fontSize: 13, padding: '8px 12px' }}
          value={form[field]} onChange={e => set(field, e.target.value)} placeholder={`Enter ${label.toLowerCase()}`} />
      ) : (
        <select className="form-input" style={{ fontSize: 13, padding: '8px 12px' }}
          value={form[field]} onChange={e => set(field, e.target.value)}>
          <option value="">— select —</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}>
      <div className="card animate-scale-in" style={{ width: 420, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header — fixed */}
        <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>✏️ Edit Clothing Item</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>All changes are saved to your wardrobe</p>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Scrollable form body */}
        <div style={{ padding: '18px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Color with hex swatch */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: 11, marginBottom: 5 }}>Color Name</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" style={{ fontSize: 13, padding: '8px 12px', flex: 1 }}
                value={form.color} onChange={e => set('color', e.target.value)} placeholder="e.g. navy blue" />
              <div style={{ width: 38, height: 38, borderRadius: 8, background: form.color_hex || '#808080', border: '2px solid rgba(0,0,0,0.12)', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} title={form.color_hex} />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: 11, marginBottom: 5 }}>Color Hex</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="color" value={form.color_hex || '#808080'}
                onChange={e => set('color_hex', e.target.value)}
                style={{ width: 38, height: 38, border: 'none', padding: 2, borderRadius: 8, cursor: 'pointer' }} />
              <input className="form-input" style={{ fontSize: 13, padding: '8px 12px', flex: 1, fontFamily: 'monospace' }}
                value={form.color_hex} onChange={e => set('color_hex', e.target.value)} placeholder="#RRGGBB" />
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--card-border)' }} />

          <SelectField label="Main Category" field="category" options={FIELD_OPTIONS.category} />
          <SelectField label="Subcategory (garment type)" field="subcategory" options={FIELD_OPTIONS.subcategory} />
          <SelectField label="Style / Type" field="style" options={FIELD_OPTIONS.style} />

          <div style={{ height: 1, background: 'var(--card-border)' }} />

          <SelectField label="Pattern" field="pattern" options={FIELD_OPTIONS.pattern} />
          <SelectField label="Material / Fabric" field="material" options={FIELD_OPTIONS.material} />

          <div style={{ height: 1, background: 'var(--card-border)' }} />

          <SelectField label="Season" field="season" options={FIELD_OPTIONS.season} />
          <SelectField label="Occasion" field="occasion" options={FIELD_OPTIONS.occasion} />
        </div>

        {/* Footer — fixed */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--card-border)', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button id={`save-edit-${item._id}`} className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Wardrobe Card ─────────────────────────────────────────────────────────────
function WardrobeCard({ item, onDelete, onUpdate }) {
  const [showEdit, setShowEdit] = useState(false);
  const [showActions, setShowActions] = useState(false);

  return (
    <>
      <div
        className="card card-interactive"
        style={{ overflow: 'hidden', position: 'relative' }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Image */}
        <div style={{ height: 180, background: 'linear-gradient(135deg, #f0ecf5, #e8e4f0)', position: 'relative', overflow: 'hidden' }}>
          {item.image_url ? (
            <img
              src={item.image_url.startsWith('/') ? item.image_url : `/${item.image_url}`}
              alt={item.subcategory || item.category}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 48 }}>
              {CATEGORY_EMOJI[item.category?.toLowerCase()] || '👗'}
            </div>
          )}

          {/* Hover overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(26,26,46,0.80)',
            display: 'flex', gap: 10,
            alignItems: 'center', justifyContent: 'center',
            opacity: showActions ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}>
            <button id={`edit-${item._id}`} className="btn btn-sm"
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => setShowEdit(true)}>
              <Edit3 size={14} /> Edit
            </button>
            <button id={`delete-${item._id}`} className="btn btn-sm"
              style={{ background: 'rgba(239,68,68,0.5)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => onDelete(item._id)}>
              <Trash2 size={14} /> Delete
            </button>
          </div>

          {/* Category badge */}
          <div className="badge badge-accent" style={{ position: 'absolute', top: 10, left: 10, textTransform: 'capitalize' }}>
            {item.subcategory || item.category}
          </div>

          {/* Color dot */}
          {item.color_hex && (
            <div title={`${item.color} · ${item.color_hex}`} style={{
              position: 'absolute', top: 10, right: 10,
              width: 18, height: 18, borderRadius: '50%',
              background: item.color_hex,
              border: '2px solid rgba(255,255,255,0.7)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }} />
          )}
        </div>

        {/* Info panel */}
        <div style={{ padding: '12px 14px 14px' }}>
          {/* Color row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {item.color_hex && (
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: item.color_hex, border: '1.5px solid rgba(0,0,0,0.12)', flexShrink: 0 }} />
            )}
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
              {item.color && item.color !== 'unknown' ? item.color : 'Color N/A'}
            </span>
            {item.color_hex && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', marginLeft: 'auto' }}>
                {item.color_hex}
              </span>
            )}
          </div>

          {/* Attribute pills row 1 */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 5 }}>
            <Pill text={item.style} />
            <Pill text={item.pattern} />
            <Pill text={item.material} />
          </div>

          {/* Attribute pills row 2 */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {item.occasion && (
              <Pill text={item.occasion} color="rgba(51,51,204,0.7)" />
            )}
            {item.season && item.season !== 'all-season' && (
              <Pill text={item.season} color="rgba(34,197,94,0.7)" />
            )}
          </div>
        </div>
      </div>

      {/* Edit modal rendered outside the card */}
      {showEdit && (
        <EditModal
          item={item}
          onSave={onUpdate}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  );
}

// ── Recommendation Modal ─────────────────────────────────────────────────────
function RecommendationModal({ recommendations, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
      <div className="card animate-scale-in" style={{ width: 600, maxHeight: '80vh', overflow: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star size={20} color="var(--accent)" />
            <h3 style={{ fontWeight: 700, fontSize: 18 }}>AI Recommendations</h3>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>
        {recommendations.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No recommendations found. Add more items to your wardrobe!</p>
        ) : (
          <div className="grid-cards">
            {recommendations.map((item, i) => (
              <div key={item._id || i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {item.image_url ? (
                  <img src={item.image_url.startsWith('/') ? item.image_url : `/${item.image_url}`}
                    alt={item.subcategory || item.category}
                    style={{ width: '100%', height: 100, objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; }} />
                ) : (
                  <div style={{ height: 100, background: 'linear-gradient(135deg, #f0ecf5, #e8e4f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
                    {CATEGORY_EMOJI[item.category?.toLowerCase()] || '👗'}
                  </div>
                )}
                <div style={{ padding: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'capitalize' }}>{item.subcategory || item.category}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    {item.color_hex && <div style={{ width: 12, height: 12, borderRadius: '50%', background: item.color_hex, border: '1px solid rgba(0,0,0,0.1)' }} />}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{item.color}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                    {item.occasion && <Pill text={item.occasion} color="rgba(51,51,204,0.7)" />}
                    {item.style && <Pill text={item.style} />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function WardrobePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [recommendations, setRecommendations] = useState(null);

  const fetchWardrobe = async () => {
    setLoading(true);
    try {
      const res = await api.get('/wardrobe');
      setItems(res.data?.wardrobe || []);
    } catch { toast.error('Failed to load wardrobe'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWardrobe(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      await api.delete(`/wardrobe/${id}`);
      setItems(prev => prev.filter(i => i._id !== id));
      toast.success('Item deleted');
    } catch { toast.error('Delete failed'); }
  };

  const handleUpdate = async (id, data) => {
    try {
      const res = await api.put(`/wardrobe/${id}`, data);
      const updated = res.data?.item || { ...data, _id: id };
      setItems(prev => prev.map(i => i._id === id ? { ...i, ...updated } : i));
      toast.success('✅ Item updated!');
    } catch { toast.error('Update failed'); }
  };

  const handleRecommend = async (id) => {
    try {
      const res = await api.get(`/wardrobe/recommend/${id}`);
      setRecommendations(res.data?.recommendations || []);
    } catch { toast.error('Failed to get recommendations'); }
  };

  const handleOutfit = async (id) => {
    try {
      const res = await api.get(`/wardrobe/outfit/${id}`);
      const outfit = res.data?.outfit;
      const outfitItems = [outfit?.top, outfit?.bottom].filter(Boolean);
      setRecommendations(outfitItems);
      toast.success('Outfit generated! ✨');
    } catch { toast.error('Failed to generate outfit'); }
  };

  const categories = ['all', ...new Set(items.map(i => i.category).filter(Boolean))];

  const filtered = items.filter(item => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      item.category?.toLowerCase().includes(q) ||
      item.subcategory?.toLowerCase().includes(q) ||
      item.color?.toLowerCase().includes(q) ||
      item.style?.toLowerCase().includes(q) ||
      item.occasion?.toLowerCase().includes(q) ||
      item.pattern?.toLowerCase().includes(q);
    const matchCat = filterCat === 'all' || item.category === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Wardrobe</h1>
        <p className="page-subtitle">{items.length} items in your collection</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="form-input-icon" style={{ flex: 1, minWidth: 200 }}>
          <Search size={16} className="input-icon" />
          <input
            id="wardrobe-search"
            className="form-input"
            placeholder="Search by category, color, style, occasion…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ margin: 0 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Filter size={14} color="var(--text-muted)" />
          {categories.map(cat => (
            <button
              key={cat}
              id={`filter-${cat}`}
              onClick={() => setFilterCat(cat)}
              className={`btn btn-sm ${filterCat === cat ? 'btn-primary' : 'btn-ghost'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {cat}
            </button>
          ))}
        </div>
        <button className="btn btn-icon btn-ghost" onClick={fetchWardrobe} title="Refresh" id="wardrobe-refresh">
          <RefreshCw size={15} />
        </button>
      </div>

      {loading ? (
        <div className="grid-cards">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ borderRadius: 16, overflow: 'hidden' }}>
              <div className="skeleton" style={{ height: 180 }} />
              <div style={{ padding: 14 }}>
                <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Shirt size={28} /></div>
            <div>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>
                {items.length === 0 ? 'Your wardrobe is empty' : 'No items match your filter'}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {items.length === 0 ? 'Upload clothing items to get started' : 'Try a different search or filter'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid-cards">
          {filtered.map((item) => (
            <WardrobeCard
              key={item._id}
              item={item}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}

      {recommendations && (
        <RecommendationModal
          recommendations={recommendations}
          onClose={() => setRecommendations(null)}
        />
      )}
    </div>
  );
}
