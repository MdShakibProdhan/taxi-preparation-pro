import { useState, useEffect } from 'react';

export default function QuestionCard({ 
  question, 
  onAnswer, 
  isExamMode = false,
  forceShowAnswer = false 
}) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const [showExplanation, setShowExplanation] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    setSelectedOption(null);
    setShowResult(false);
    setShowExplanation(false);
  }, [question.id]);

  useEffect(() => {
    if (forceShowAnswer) {
      setShowResult(true);
    }
  }, [forceShowAnswer]);

  const handleSelect = (letter) => {
    if (showResult && !isExamMode) return; // Prevent changing answer after reveal in study modes
    setSelectedOption(letter);
    
    if (isExamMode) {
      onAnswer && onAnswer(question.id, letter, letter === question.correctAnswer);
    } else {
      setShowResult(true);
      onAnswer && onAnswer(question.id, letter, letter === question.correctAnswer);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, flex: 1, marginRight: '1rem' }}>
          {question.question}
        </h3>
        <span className="badge badge-primary">{question.sourceFile}</span>
      </div>
      
      <div className="options-list">
        {question.options.map((opt) => {
          let className = 'option-card';
          
          if (showResult) {
            if (opt.label === question.correctAnswer) {
              className += ' correct';
            } else if (opt.label === selectedOption && selectedOption !== question.correctAnswer) {
              className += ' incorrect';
            } else {
              className += ' disabled';
            }
          } else if (selectedOption === opt.label) {
            className += ' selected';
          }
          
          return (
            <div 
              key={opt.label} 
              className={className}
              onClick={() => handleSelect(opt.label)}
            >
              <span className="option-letter">{opt.label}</span>
              <span className="option-text">{opt.text}</span>
            </div>
          );
        })}
      </div>
      
      {showResult && question.aiDetermined && (
        <div className="ai-explanation" style={{ marginTop: '1rem' }}>
          <strong>⚠️ AI-determined answer:</strong><br />
          {question.explanation}
        </div>
      )}

      {showResult && (
        <div style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
          <button 
            onClick={() => setShowExplanation(!showExplanation)}
            style={{
              background: 'none', border: 'none', color: 'var(--color-primary)', 
              fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline'
            }}
          >
            {showExplanation ? 'Hide explanation' : 'Show explanation'}
          </button>

          {showExplanation && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#334155' }}>Learn more</h4>
              
              {question.specialPatterns && question.specialPatterns.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  {question.specialPatterns.map(p => (
                    <span key={p} style={{ backgroundColor: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                      {p === 'numbers' ? '🔢 Numbers pattern' : p === 'age' ? '🎂 Age-related' : '🖼️ Image source'}
                    </span>
                  ))}
                </div>
              )}

              {question.englishTranslation && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h5 style={{ fontSize: '0.875rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>English Translation</h5>
                  <p style={{ fontWeight: 500, marginBottom: '0.75rem' }}>{question.englishTranslation.question}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {question.englishTranslation.options.map(opt => {
                      const isCorrect = opt.label === question.correctAnswer;
                      return (
                        <div key={opt.label} style={{
                          padding: '0.5rem', borderRadius: '6px', fontSize: '0.9rem',
                          backgroundColor: isCorrect ? '#dcfce7' : 'white',
                          border: `1px solid ${isCorrect ? '#86efac' : '#cbd5e1'}`,
                          display: 'flex', gap: '0.5rem'
                        }}>
                          <span style={{ fontWeight: 600 }}>{opt.label})</span>
                          <span>{opt.text}</span>
                          {isCorrect && <span style={{ marginLeft: 'auto', color: '#15803d', fontSize: '0.75rem', fontWeight: 700 }}>CORRECT</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {question.confidenceKeywords && question.confidenceKeywords.length > 0 && (
                <div>
                  <h5 style={{ fontSize: '0.875rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Keywords</h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {question.confidenceKeywords.map((kw, i) => (
                      <div key={i} style={{
                        backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', 
                        padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column',
                        borderLeft: `4px solid ${kw.confidence === 'solid' ? '#10b981' : '#f59e0b'}`
                      }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{kw.term}</span>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{kw.translation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
