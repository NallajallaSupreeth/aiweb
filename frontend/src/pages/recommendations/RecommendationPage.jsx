import { useEffect, useState } from 'react';
import { Star, Zap, RefreshCw, Sparkles, ChevronRight } from 'lucide-react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CATEGORY_EMOJI = {
  top: '👕', bottom: '👖', dress: '👗', shoes: '👟',
  accessories: '💎', outerwear: '🧥', other: '🎽',
};

function OutfitCard({ outfit, index }) {
  const items = [outfit?.top, outfit?.bottom, ...(outfit?.accessories || [])].filter(Boolean);

  return (
    <div className="card card-interactive animate-fade-in" style={{
      padding: 0, overflow: 'hidden',
      animationDelay: `${index * 0.08}s`, animationFillMode: 'both',
    }}>
      {/* Outfit visual */}
      <div style={{
        height: 200,
        background: `linear-gradient(135deg, hsl(${index * 60}, 60%, 95%), hsl(${index * 60 + 30}, 50%, 90%))`,
        display: 'grid',
        gridTemplateColumns: items.length > 1 ? '1fr 1fr' : '1fr',
        gap: 2,
        overflow: 'hidden',
      }}>
        {items.slice(0, 2).map((item, i) => (
          <div key={i} style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {item.image_url ? (
              <img
                src={item.image_url.startsWith('/') ? item.image_url : `/${item.image_url}`}
                alt={item.category}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <div style={{ fontSize: 36, display: item.image_url ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              {CATEGORY_EMOJI[item.category?.toLowerCase()] || '👗'}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Sparkles size={14} color="var(--accent)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
            AI Outfit #{index + 1}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'rgba(51,51,204,0.06)', borderRadius: 6 }}>
              <span style={{ fontSize: 11 }}>{CATEGORY_EMOJI[item.category?.toLowerCase()] || '👗'}</span>
              <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'capitalize' }}>{item.category}</span>
            </div>
          ))}
        </div>
        {items[0]?.color && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: items[0].color.toLowerCase() === 'white' ? '#f0f0f0' : items[0].color,
              border: '1px solid rgba(0,0,0,0.12)',
            }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {items.map(i => i.color).filter(Boolean).join(' · ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function RecommendationItem({ item, index }) {
  return (
    <div className="card card-interactive animate-fade-in" style={{
      padding: 0, overflow: 'hidden',
      animationDelay: `${index * 0.06}s`, animationFillMode: 'both',
    }}>
      <div style={{ height: 160, background: 'linear-gradient(135deg, #f0ecf5, #e8e4f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {item.image_url ? (
          <img
            src={item.image_url.startsWith('/') ? item.image_url : `/${item.image_url}`}
            alt={item.category}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: 48 }}>{CATEGORY_EMOJI[item.category?.toLowerCase()] || '👗'}</span>
        )}
      </div>
      <div style={{ padding: 14 }}>
        <div className="badge badge-accent" style={{ marginBottom: 6 }}>{item.category}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.color}{item.pattern ? ` · ${item.pattern}` : ''}</div>
      </div>
    </div>
  );
}

export default function RecommendationPage() {
  const [wardrobe, setWardrobe] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('outfits');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/wardrobe').then(r => setWardrobe(r.data?.wardrobe || [])).catch(() => {});
  }, []);

  const generateOutfits = async () => {
    if (wardrobe.length === 0) { toast.error('Add items to your wardrobe first'); return; }
    setLoading(true);
    setOutfits([]);
    try {
      const results = [];
      // Generate outfits from first 4 items
      const items = wardrobe.slice(0, 4);
      await Promise.all(items.map(async (item) => {
        try {
          const res = await api.get(`/wardrobe/outfit/${item._id}`);
          if (res.data?.outfit) results.push(res.data.outfit);
        } catch {}
      }));
      setOutfits(results);
      if (results.length === 0) toast.error('Could not generate outfits. Add more clothing types.');
      else toast.success(`Generated ${results.length} outfit${results.length > 1 ? 's' : ''}! ✨`);
    } catch { toast.error('Failed to generate outfits'); }
    finally { setLoading(false); }
  };

  const getRecommendations = async () => {
    if (wardrobe.length === 0) { toast.error('Add items to your wardrobe first'); return; }
    setLoading(true);
    setRecommendations([]);
    try {
      const firstItem = wardrobe[0];
      const res = await api.get(`/wardrobe/recommend/${firstItem._id}`);
      setRecommendations(res.data?.recommendations || []);
      toast.success('AI recommendations ready! ✨');
    } catch { toast.error('Failed to get recommendations'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Star size={28} color="var(--accent)" /> AI Recommendations
        </h1>
        <p className="page-subtitle">
          {wardrobe.length} items in your wardrobe · AI-generated outfit combinations
        </p>
      </div>

      {/* Action bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'outfits', label: '👗 Outfits', icon: Zap },
            { id: 'items', label: '⭐ Recommendations', icon: Star },
          ].map(tab => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button
            id="generate-outfits"
            className="btn btn-primary"
            onClick={generateOutfits}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {loading ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={15} />}
            Generate Outfits
          </button>
          <button
            id="get-recommendations"
            className="btn btn-secondary"
            onClick={getRecommendations}
            disabled={loading}
          >
            <Star size={15} /> Get Recs
          </button>
        </div>
      </div>

      {wardrobe.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Star size={28} /></div>
            <div>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>No wardrobe items found</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Upload clothing to get AI-powered outfit recommendations
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/upload')}>
              Upload Clothing <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ) : activeTab === 'outfits' ? (
        <div>
          {outfits.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>✨</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No outfits generated yet</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
                Click "Generate Outfits" to let AI create complete looks from your wardrobe
              </p>
              <button id="generate-outfits-empty" className="btn btn-primary" onClick={generateOutfits} disabled={loading}>
                <Zap size={15} /> Generate My Outfits
              </button>
            </div>
          ) : (
            <div className="grid-cards">
              {outfits.map((outfit, i) => (
                <OutfitCard key={i} outfit={outfit} index={i} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {recommendations.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>⭐</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No recommendations yet</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
                Click "Get Recs" to see AI-suggested items that match your wardrobe
              </p>
              <button id="get-recs-empty" className="btn btn-secondary" onClick={getRecommendations} disabled={loading}>
                <Star size={15} /> Get Recommendations
              </button>
            </div>
          ) : (
            <div className="grid-cards">
              {recommendations.map((item, i) => (
                <RecommendationItem key={item._id || i} item={item} index={i} />
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
