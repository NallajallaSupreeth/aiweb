import { useEffect, useState } from 'react';
import {
  Shirt, Trash2, Edit3, Star, Zap, X, Search, Filter, RefreshCw
} from 'lucide-react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const CATEGORY_EMOJI = {
  top: '👕', bottom: '👖', dress: '👗', shoes: '👟',
  accessories: '💎', outerwear: '🧥', other: '🎽',
};

function WardrobeCard({ item, onDelete, onUpdate, onRecommend, onOutfit }) {
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState({ category: item.category, color: item.color, occasion: item.occasion });
  const [showActions, setShowActions] = useState(false);

  const handleUpdate = async () => {
    onUpdate(item._id, editData);
    setShowEdit(false);
  };

  return (
    <div
      className="card card-interactive"
      style={{ overflow: 'hidden', position: 'relative' }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Image */}
      <div style={{ height: 160, background: 'linear-gradient(135deg, #f0ecf5, #e8e4f0)', position: 'relative', overflow: 'hidden' }}>
        {item.image_url ? (
          <img
            src={item.image_url.startsWith('/') ? item.image_url : `/${item.image_url}`}
            alt={item.category}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 48 }}>
            {CATEGORY_EMOJI[item.category?.toLowerCase()] || '👗'}
          </div>
        )}

        {/* Hover action overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(26,26,46,0.75)',
          display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', justifyContent: 'center',
          opacity: showActions ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}>
          <button
            id={`recommend-${item._id}`}
            className="btn btn-primary btn-sm"
            onClick={() => onRecommend(item._id)}
            style={{ width: 140, justifyContent: 'center' }}
          >
            <Star size={13} /> Recommend
          </button>
          <button
            id={`outfit-${item._id}`}
            className="btn btn-secondary btn-sm"
            onClick={() => onOutfit(item._id)}
            style={{ width: 140, justifyContent: 'center', background: 'rgba(255,255,255,0.9)', color: 'var(--accent)' }}
          >
            <Zap size={13} /> Gen Outfit
          </button>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              id={`edit-${item._id}`}
              className="btn btn-icon"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none' }}
              onClick={() => setShowEdit(true)}
            >
              <Edit3 size={14} />
            </button>
            <button
              id={`delete-${item._id}`}
              className="btn btn-icon"
              style={{ background: 'rgba(239,68,68,0.3)', color: 'white', border: 'none' }}
              onClick={() => onDelete(item._id)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Category badge */}
        <div className="badge badge-accent" style={{ position: 'absolute', top: 10, left: 10 }}>
          {item.category}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          {item.color && (
            <div style={{
              width: 14, height: 14, borderRadius: '50%',
              background: item.color.toLowerCase() === 'white' ? '#f0f0f0' : item.color,
              border: '1.5px solid rgba(0,0,0,0.12)', flexShrink: 0,
            }} />
          )}
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {item.color || 'Unknown color'}
          </span>
        </div>
        {item.pattern && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.pattern}</div>
        )}
        {item.occasion && (
          <div className="badge badge-accent" style={{ marginTop: 6 }}>{item.occasion}</div>
        )}
      </div>

      {/* Edit modal */}
      {showEdit && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
        }}>
          <div className="card animate-scale-in" style={{ width: 360, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700 }}>Edit Item</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowEdit(false)}><X size={16} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={editData.category}
                onChange={e => setEditData(f => ({ ...f, category: e.target.value }))}>
                {['top', 'bottom', 'dress', 'shoes', 'accessories', 'outerwear', 'other'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <input className="form-input" value={editData.color}
                onChange={e => setEditData(f => ({ ...f, color: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Occasion</label>
              <select className="form-input" value={editData.occasion}
                onChange={e => setEditData(f => ({ ...f, occasion: e.target.value }))}>
                {['casual', 'formal', 'party', 'work', 'sport', 'all'].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowEdit(false)}>Cancel</button>
              <button id={`save-edit-${item._id}`} className="btn btn-primary" onClick={handleUpdate}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RecommendationModal({ recommendations, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
    }}>
      <div className="card animate-scale-in" style={{ width: 560, maxHeight: '80vh', overflow: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star size={20} color="var(--accent)" />
            <h3 style={{ fontWeight: 700, fontSize: 18 }}>AI Recommendations</h3>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>
        {recommendations.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No recommendations found</p>
        ) : (
          <div className="grid-cards">
            {recommendations.map((item, i) => (
              <div key={item._id || i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ height: 100, background: 'linear-gradient(135deg, #f0ecf5, #e8e4f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                  {CATEGORY_EMOJI[item.category?.toLowerCase()] || '👗'}
                </div>
                <div style={{ padding: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{item.category}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.color}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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
      setItems(prev => prev.map(i => i._id === id ? { ...i, ...res.data.item } : i));
      toast.success('Item updated!');
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
      const items = [outfit?.top, outfit?.bottom].filter(Boolean);
      setRecommendations(items);
      toast.success('Outfit generated! ✨');
    } catch { toast.error('Failed to generate outfit'); }
  };

  const categories = ['all', ...new Set(items.map(i => i.category).filter(Boolean))];

  const filtered = items.filter(item => {
    const matchSearch = !search ||
      item.category?.toLowerCase().includes(search.toLowerCase()) ||
      item.color?.toLowerCase().includes(search.toLowerCase());
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
            placeholder="Search by category or color…"
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
              <div className="skeleton" style={{ height: 160 }} />
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
          {filtered.map((item, i) => (
            <WardrobeCard
              key={item._id}
              item={item}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              onRecommend={handleRecommend}
              onOutfit={handleOutfit}
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
