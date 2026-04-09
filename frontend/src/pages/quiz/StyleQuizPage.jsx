import { useState } from 'react';
import { ChevronRight, CheckCircle, Brain, SkipForward } from 'lucide-react';
import toast from 'react-hot-toast';

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: 'Which style vibe best describes you?',
    emoji: '✨',
    options: [
      { id: 'a', label: 'Minimalist', desc: 'Clean lines, neutral palettes', emoji: '⬜' },
      { id: 'b', label: 'Streetwear', desc: 'Bold, urban, relaxed', emoji: '🧢' },
      { id: 'c', label: 'Classic', desc: 'Timeless, elegant, polished', emoji: '👔' },
      { id: 'd', label: 'Bohemian', desc: 'Free-spirited, eclectic, earthy', emoji: '🌿' },
    ],
  },
  {
    id: 2,
    question: 'What is your go-to color palette?',
    emoji: '🎨',
    options: [
      { id: 'a', label: 'Neutrals', desc: 'Beige, white, grey, black', emoji: '🤍' },
      { id: 'b', label: 'Earth Tones', desc: 'Terracotta, olive, camel', emoji: '🟫' },
      { id: 'c', label: 'Bold Colors', desc: 'Red, royal blue, emerald', emoji: '🔴' },
      { id: 'd', label: 'Pastels', desc: 'Soft pink, lavender, mint', emoji: '🩷' },
    ],
  },
  {
    id: 3,
    question: 'Which occasions do you dress for most?',
    emoji: '📅',
    options: [
      { id: 'a', label: 'Work / Office', desc: 'Professional and polished', emoji: '💼' },
      { id: 'b', label: 'Casual Daily', desc: 'Comfortable, put-together', emoji: '☕' },
      { id: 'c', label: 'Night Out', desc: 'Trendy, elevated, fun', emoji: '🌙' },
      { id: 'd', label: 'All of the above', desc: 'I need a versatile wardrobe', emoji: '🔄' },
    ],
  },
  {
    id: 4,
    question: 'What matters most to you in clothing?',
    emoji: '💡',
    options: [
      { id: 'a', label: 'Comfort', desc: 'Feel good all day', emoji: '😊' },
      { id: 'b', label: 'Style', desc: 'Look amazing always', emoji: '💅' },
      { id: 'c', label: 'Sustainability', desc: 'Eco-friendly choices', emoji: '🌍' },
      { id: 'd', label: 'Value', desc: 'Great quality for the price', emoji: '💰' },
    ],
  },
  {
    id: 5,
    question: 'How do you feel about patterns and prints?',
    emoji: '🎭',
    options: [
      { id: 'a', label: 'Love them!', desc: 'More is more', emoji: '🐆' },
      { id: 'b', label: 'Subtle only', desc: 'Small prints or textures', emoji: '〰️' },
      { id: 'c', label: 'Solids please', desc: 'Keep it clean and simple', emoji: '⚫' },
      { id: 'd', label: 'Depends on mood', desc: 'Mix and match', emoji: '🎲' },
    ],
  },
];

const STYLE_RESULTS = {
  minimalist: {
    title: 'The Minimalist Aesthetic',
    description: 'Your style is refined and intentional. You gravitate towards clean silhouettes, quality basics, and a curated wardrobe that speaks volumes through simplicity.',
    colors: ['#F5F0E8', '#9B9B9B', '#1A1A2E', '#E0D8D8'],
    tips: ['Invest in quality basics', 'Stick to a 3-color rule', 'Choose structured silhouettes'],
  },
  classic: {
    title: 'The Classic Sophisticate',
    description: 'Timeless, elegant, and always polished — your wardrobe is built to last. You prefer investment pieces that transcend trends.',
    colors: ['#1A1A2E', '#C4A882', '#FFFFFF', '#8B6914'],
    tips: ['Build a capsule wardrobe', 'Focus on tailored fits', 'Mix heritage and modern'],
  },
};

export default function StyleQuizPage() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  const question = QUIZ_QUESTIONS[currentQ];
  const progress = ((currentQ + 1) / QUIZ_QUESTIONS.length) * 100;

  const handleSelect = (optionId) => {
    setSelectedOption(optionId);
    setAnswers(prev => ({ ...prev, [question.id]: optionId }));
  };

  const handleNext = () => {
    if (!selectedOption) { toast.error('Please select an option'); return; }
    if (currentQ < QUIZ_QUESTIONS.length - 1) {
      setCurrentQ(c => c + 1);
      setSelectedOption(answers[QUIZ_QUESTIONS[currentQ + 1]?.id] || null);
    } else {
      setCompleted(true);
      toast.success('Style quiz complete! 🎉');
    }
  };

  const handleSkip = () => {
    if (currentQ < QUIZ_QUESTIONS.length - 1) {
      setCurrentQ(c => c + 1);
      setSelectedOption(null);
    } else {
      setCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentQ(0);
    setAnswers({});
    setCompleted(false);
    setSelectedOption(null);
  };

  const result = STYLE_RESULTS[
    answers[1] === 'a' ? 'minimalist' : 'classic'
  ] || STYLE_RESULTS.classic;

  if (completed) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div className="page-header">
          <h1 className="page-title">Your Style DNA ✨</h1>
          <p className="page-subtitle">Based on your quiz answers</p>
        </div>

        <div className="card animate-scale-in" style={{ padding: 36, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg, #3333CC, #8844ee)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(51,51,204,0.3)' }}>
            <CheckCircle size={32} color="white" />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 12 }}>{result.title}</h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 460, margin: '0 auto 28px' }}>
            {result.description}
          </p>

          {/* Color palette */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 12 }}>YOUR COLOR PALETTE</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {result.colors.map((c, i) => (
                <div key={i} style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: c, border: '2px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }} title={c} />
              ))}
            </div>
          </div>

          {/* Style tips */}
          <div style={{ background: 'rgba(51,51,204,0.04)', borderRadius: 12, padding: 20, marginBottom: 28, textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 12 }}>STYLE TIPS FOR YOU</div>
            {result.tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: i < result.tips.length - 1 ? 10 : 0 }}>
                <CheckCircle size={16} color="#22c55e" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{tip}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-ghost" onClick={handleRestart}>Retake Quiz</button>
            <button className="btn btn-primary" onClick={() => window.location.href = '/recommendations'}>
              View Recommendations ✨
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Brain size={28} color="var(--accent)" /> Style Quiz
        </h1>
        <p className="page-subtitle">Discover your personal style identity in 5 questions</p>
      </div>

      {/* Progress */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Question {currentQ + 1} of {QUIZ_QUESTIONS.length}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{Math.round(progress)}% complete</span>
        </div>
        <div style={{ height: 8, background: '#f0ecf5', borderRadius: 100, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #3333CC, #8844ee)',
            borderRadius: 100,
            transition: 'width 0.4s ease',
          }} />
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          {QUIZ_QUESTIONS.map((q, i) => (
            <div key={q.id} style={{
              flex: 1, height: 4, borderRadius: 100,
              background: i < currentQ
                ? 'var(--accent)'
                : i === currentQ
                ? 'rgba(51,51,204,0.3)'
                : '#f0ecf5',
              transition: 'background 0.3s ease',
            }} />
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="card animate-fade-in" style={{ padding: 32 }} key={currentQ}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{question.emoji}</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
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
                  transform: isSelected ? 'scale(1.01)' : 'scale(1)',
                  boxShadow: isSelected ? '0 4px 16px rgba(51,51,204,0.15)' : 'none',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {isSelected && (
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <CheckCircle size={18} color="var(--accent)" />
                  </div>
                )}
                <div style={{ fontSize: 24, marginBottom: 8 }}>{opt.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: isSelected ? 'var(--accent)' : 'var(--text-primary)', marginBottom: 4 }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{opt.desc}</div>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={handleSkip} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <SkipForward size={14} /> Skip
          </button>
          <button
            id="quiz-next"
            className="btn btn-primary"
            onClick={handleNext}
            style={{ flex: 1, maxWidth: 220, justifyContent: 'center' }}
          >
            {currentQ === QUIZ_QUESTIONS.length - 1 ? 'See My Style DNA ✨' : (<>Next <ChevronRight size={15} /></>)}
          </button>
        </div>
      </div>
    </div>
  );
}
