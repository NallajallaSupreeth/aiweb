import { useState, useEffect, useRef } from 'react';
import { Brain, ChevronRight, CheckCircle, SkipForward, RefreshCw, Sparkles, User, MapPin, Briefcase, Thermometer } from 'lucide-react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const TOTAL_QUESTIONS = 7;

// ── User Context Setup Screen ─────────────────────────────────────────────────
function ContextScreen({ onStart }) {
  const [ctx, setCtx] = useState({
    gender: 'unspecified',
    age_group: 'adult',
    climate: 'moderate',
    lifestyle: 'general',
  });

  const set = (k, v) => setCtx(p => ({ ...p, [k]: v }));

  const fields = [
    {
      key: 'gender', label: 'Gender', icon: User,
      options: ['male', 'female', 'non-binary', 'unspecified'],
    },
    {
      key: 'age_group', label: 'Age Group', icon: User,
      options: ['teen (13-17)', 'young adult (18-24)', 'adult (25-35)', 'mid-adult (36-50)', '50+'],
    },
    {
      key: 'climate', label: 'Your Climate', icon: Thermometer,
      options: ['tropical', 'hot & dry', 'moderate', 'cold', 'cold & snowy'],
    },
    {
      key: 'lifestyle', label: 'Your Lifestyle', icon: Briefcase,
      options: ['college student', 'working professional', 'creative / artist', 'athlete', 'influencer', 'entrepreneur'],
    },
  ];

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Brain size={28} color="var(--accent)" /> AI Style Quiz
        </h1>
        <p className="page-subtitle">
          Powered by Gemini AI · {TOTAL_QUESTIONS} adaptive questions · Personalized Style DNA
        </p>
      </div>

      <div className="card animate-scale-in" style={{ padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #3333CC, #8844ee)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Tell us about yourself</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>This helps AI personalize every question</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {fields.map(({ key, label, icon: Icon, options }) => (
            <div key={key} className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Icon size={14} color="var(--accent)" /> {label}
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => set(key, opt)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 100,
                      border: `1.5px solid ${ctx[key] === opt ? 'var(--accent)' : 'rgba(90,90,122,0.2)'}`,
                      background: ctx[key] === opt ? 'rgba(51,51,204,0.08)' : 'transparent',
                      color: ctx[key] === opt ? 'var(--accent)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 13,
                      fontWeight: ctx[key] === opt ? 700 : 400,
                      transition: 'all 0.2s',
                      textTransform: 'capitalize',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          id="start-quiz"
          className="btn btn-primary"
          onClick={() => onStart(ctx)}
          style={{ marginTop: 28, width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15 }}
        >
          <Sparkles size={16} /> Start My Style Quiz →
        </button>
      </div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function QuestionSkeleton() {
  return (
    <div className="card" style={{ padding: 32, maxWidth: 680, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#f0ecf5', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCw size={24} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-secondary)', marginBottom: 6 }}>Gemini AI is crafting your next question…</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Personalizing based on your answers</div>
      </div>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ height: 80, borderRadius: 12, background: '#f5f0ff', marginBottom: 12, animation: `pulse 1.5s ease-in-out ${i * 0.15}s infinite` }} />
      ))}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}

// ── Style DNA Result Screen ───────────────────────────────────────────────────
function StyleDNAResult({ dna, onRetake }) {
  const navigate = useNavigate();
  const scoreEntries = Object.entries(dna.style_score || {});

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1 className="page-title">Your Style DNA ✨</h1>
        <p className="page-subtitle">Powered by Gemini AI · Personalized analysis</p>
      </div>

      {/* Hero card */}
      <div className="card animate-scale-in" style={{ padding: 40, textAlign: 'center', marginBottom: 20, background: 'linear-gradient(135deg, #3333CC08, #8844ee08)' }}>
        <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg, #3333CC, #8844ee)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 28px rgba(51,51,204,0.3)' }}>
          <Sparkles size={36} color="white" />
        </div>
        <div className="badge badge-accent" style={{ marginBottom: 12, fontSize: 12 }}>{dna.style_archetype}</div>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>{dna.style_title}</h2>
        {dna.secondary_style && (
          <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, marginBottom: 12 }}>
            with {dna.secondary_style} influences
          </div>
        )}
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: 520, margin: '0 auto 24px' }}>
          {dna.description}
        </p>

        {/* Personality traits */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {(dna.personality_traits || []).map((trait, i) => (
            <span key={i} style={{ padding: '4px 12px', background: 'rgba(51,51,204,0.08)', borderRadius: 100, fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
              {trait}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Color Palette */}
        <div className="card animate-fade-in" style={{ padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 16, textTransform: 'uppercase' }}>
            Color Palette
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>PRIMARY</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(dna.color_palette?.primary || []).map((c, i) => (
                <div key={i} style={{ width: 40, height: 40, borderRadius: 10, background: c, border: '2px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} title={c} />
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>ACCENT</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(dna.color_palette?.accent || []).map((c, i) => (
                <div key={i} style={{ width: 30, height: 30, borderRadius: 8, background: c, border: '2px solid rgba(0,0,0,0.08)' }} title={c} />
              ))}
            </div>
          </div>
        </div>

        {/* Style Scores */}
        <div className="card animate-fade-in" style={{ padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 16, textTransform: 'uppercase' }}>
            Style Score
          </div>
          {scoreEntries.map(([style, score]) => (
            <div key={style} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{style}</span>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{score}%</span>
              </div>
              <div style={{ height: 6, background: '#f0ecf5', borderRadius: 100 }}>
                <div style={{ height: '100%', width: `${score}%`, background: 'linear-gradient(90deg, #3333CC, #8844ee)', borderRadius: 100, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key pieces + Style tips */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card animate-fade-in" style={{ padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 16, textTransform: 'uppercase' }}>
            🛍️ Key Wardrobe Pieces
          </div>
          {(dna.key_pieces || []).map((piece, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 22, height: 22, background: 'rgba(51,51,204,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>{i + 1}</div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{piece}</span>
            </div>
          ))}
        </div>

        <div className="card animate-fade-in" style={{ padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 16, textTransform: 'uppercase' }}>
            💡 Style Tips
          </div>
          {(dna.style_tips || []).map((tip, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
              <CheckCircle size={16} color="#22c55e" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fit + Occasion info */}
      {(dna.fit_preference || dna.occasion_strength) && (
        <div className="card animate-fade-in" style={{ padding: 24, marginBottom: 20, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          {dna.fit_preference && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Preferred Fit</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', textTransform: 'capitalize' }}>👗 {dna.fit_preference}</div>
            </div>
          )}
          {dna.occasion_strength && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Strongest At</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', textTransform: 'capitalize' }}>✨ {dna.occasion_strength}</div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 40 }}>
        <button className="btn btn-ghost" onClick={onRetake}>🔄 Retake Quiz</button>
        <button className="btn btn-primary" onClick={() => navigate('/recommendations')}>
          View My Recommendations ✨
        </button>
      </div>
    </div>
  );
}

// ── Main Quiz Component ───────────────────────────────────────────────────────
export default function StyleQuizPage() {
  const [phase, setPhase] = useState('context'); // context | quiz | loading | result
  const [userCtx, setUserCtx] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [styleDNA, setStyleDNA] = useState(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [loadingResult, setLoadingResult] = useState(false);

  const fetchNextQuestion = async (ctx, prevAnswers, qNumber) => {
    setLoadingQuestion(true);
    try {
      const res = await api.post('/quiz/question', {
        gender: ctx.gender,
        age_group: ctx.age_group,
        climate: ctx.climate,
        lifestyle: ctx.lifestyle,
        previous_answers: prevAnswers,
        style_profile: {},
        question_number: qNumber,
      });
      return res.data?.question;
    } catch (err) {
      toast.error('Failed to load question. Check your Gemini API key.');
      return null;
    } finally {
      setLoadingQuestion(false);
    }
  };

  const handleStart = async (ctx) => {
    setUserCtx(ctx);
    setPhase('quiz');
    const q = await fetchNextQuestion(ctx, [], 1);
    if (q) setQuestions([q]);
  };

  const handleSelect = (optionId) => setSelectedOption(optionId);

  const handleNext = async () => {
    if (!selectedOption) { toast.error('Please select an option'); return; }
    const question = questions[currentQ];
    const chosen = question.options.find(o => o.id === selectedOption);

    const updatedAnswers = [...answers, {
      question_id: question.question_id,
      question: question.question,
      selected: selectedOption,
      label: chosen?.label || '',
      style_tags: chosen?.style_tags || [],
      color_tags: chosen?.color_tags || [],
      fit: chosen?.fit || '',
    }];
    setAnswers(updatedAnswers);

    if (currentQ + 1 >= TOTAL_QUESTIONS) {
      // Generate Style DNA
      setLoadingResult(true);
      try {
        const res = await api.post('/quiz/result', {
          answers: updatedAnswers,
          user_context: userCtx,
        });
        setStyleDNA(res.data?.style_dna);
        setPhase('result');
        toast.success('Your Style DNA is ready! ✨');
      } catch {
        toast.error('Failed to generate Style DNA');
      } finally {
        setLoadingResult(false);
      }
    } else {
      const nextNum = currentQ + 2;
      const nextQ = await fetchNextQuestion(userCtx, updatedAnswers, nextNum);
      if (nextQ) {
        setQuestions(prev => [...prev, nextQ]);
        setCurrentQ(c => c + 1);
        setSelectedOption(null);
      }
    }
  };

  const handleSkip = async () => {
    if (currentQ + 1 >= TOTAL_QUESTIONS) {
      setPhase('result');
      return;
    }
    const nextNum = currentQ + 2;
    const nextQ = await fetchNextQuestion(userCtx, answers, nextNum);
    if (nextQ) {
      setQuestions(prev => [...prev, nextQ]);
      setCurrentQ(c => c + 1);
      setSelectedOption(null);
    }
  };

  const handleRetake = () => {
    setPhase('context');
    setQuestions([]);
    setAnswers([]);
    setCurrentQ(0);
    setSelectedOption(null);
    setStyleDNA(null);
    setUserCtx(null);
  };

  if (phase === 'context') return <ContextScreen onStart={handleStart} />;

  if (phase === 'result') {
    if (loadingResult) {
      return (
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div className="card" style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✨</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Gemini is analyzing your style…</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Crafting your personalized Style DNA</p>
            <div style={{ marginTop: 24, height: 4, background: '#f0ecf5', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '60%', background: 'linear-gradient(90deg, #3333CC, #8844ee)', borderRadius: 100, animation: 'slide 1.5s ease-in-out infinite' }} />
            </div>
          </div>
          <style>{`@keyframes slide { 0% { width: 0%; margin-left: 0; } 50% { width: 80%; } 100% { width: 0%; margin-left: 100%; } }`}</style>
        </div>
      );
    }
    if (styleDNA) return <StyleDNAResult dna={styleDNA} onRetake={handleRetake} />;
  }

  // Quiz phase
  if (loadingQuestion && questions.length === 0) return <QuestionSkeleton />;

  const question = questions[currentQ];
  if (!question) return <QuestionSkeleton />;

  const progress = ((currentQ + 1) / TOTAL_QUESTIONS) * 100;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Brain size={24} color="var(--accent)" /> Style Quiz
          <span className="badge badge-accent" style={{ fontSize: 11, marginLeft: 4 }}>Gemini AI</span>
        </h1>
        <p className="page-subtitle">{userCtx?.lifestyle} · {userCtx?.climate} climate · AI-adaptive</p>
      </div>

      {/* Progress */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Question {currentQ + 1} of {TOTAL_QUESTIONS}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{Math.round(progress)}% complete</span>
        </div>
        <div style={{ height: 8, background: '#f0ecf5', borderRadius: 100, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #3333CC, #8844ee)', borderRadius: 100, transition: 'width 0.4s ease' }} />
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {Array.from({ length: TOTAL_QUESTIONS }, (_, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 100, background: i < currentQ ? 'var(--accent)' : i === currentQ ? 'rgba(51,51,204,0.3)' : '#f0ecf5', transition: 'background 0.3s' }} />
          ))}
        </div>
      </div>

      {/* Question card */}
      {loadingQuestion ? <QuestionSkeleton /> : (
        <div className="card animate-fade-in" style={{ padding: 32 }} key={currentQ}>
          {/* Context badges */}
          {question.context && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {question.context.occasion && <span style={{ padding: '3px 10px', background: 'rgba(51,51,204,0.06)', borderRadius: 100, fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>📅 {question.context.occasion}</span>}
              {question.context.weather && <span style={{ padding: '3px 10px', background: 'rgba(51,51,204,0.06)', borderRadius: 100, fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>🌤️ {question.context.weather}</span>}
              {question.context.mood && <span style={{ padding: '3px 10px', background: 'rgba(51,51,204,0.06)', borderRadius: 100, fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>💭 {question.context.mood}</span>}
            </div>
          )}

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>{question.emoji || '✨'}</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {question.question}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {question.options.map((opt) => {
              const isSelected = selectedOption === opt.id;
              return (
                <button
                  key={opt.id}
                  id={`quiz-option-${opt.id}`}
                  onClick={() => handleSelect(opt.id)}
                  style={{
                    padding: '18px 20px',
                    border: `2px solid ${isSelected ? 'var(--accent)' : 'rgba(90,90,122,0.15)'}`,
                    borderRadius: 14,
                    background: isSelected ? 'rgba(51,51,204,0.07)' : 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: isSelected ? '0 4px 20px rgba(51,51,204,0.18)' : 'none',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {isSelected && (
                    <div style={{ position: 'absolute', top: 10, right: 10 }}>
                      <CheckCircle size={18} color="var(--accent)" />
                    </div>
                  )}
                  <div style={{ fontSize: 26, marginBottom: 8 }}>{opt.emoji || '👗'}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: isSelected ? 'var(--accent)' : 'var(--text-primary)', marginBottom: 4 }}>
                    {opt.label || opt.id}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{opt.text}</div>
                  {/* Style tags */}
                  {opt.style_tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                      {opt.style_tags.slice(0, 2).map(tag => (
                        <span key={tag} style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(51,51,204,0.08)', borderRadius: 100, color: 'var(--accent)', fontWeight: 600, textTransform: 'capitalize' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={handleSkip} disabled={loadingQuestion} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <SkipForward size={14} /> Skip
            </button>
            <button
              id="quiz-next"
              className="btn btn-primary"
              onClick={handleNext}
              disabled={loadingQuestion}
              style={{ flex: 1, maxWidth: 240, justifyContent: 'center' }}
            >
              {loadingQuestion ? (
                <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading…</>
              ) : currentQ + 1 >= TOTAL_QUESTIONS ? (
                'Get My Style DNA ✨'
              ) : (
                <>Next <ChevronRight size={15} /></>
              )}
            </button>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
