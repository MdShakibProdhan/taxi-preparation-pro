import { useState, useMemo } from 'react';
import questionsData from '../data/questions.json';
import QuestionCard from '../components/QuestionCard';

export default function QuestionBank() {
  const [page, setPage] = useState(1);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  
  const ITEMS_PER_PAGE = 50;
  
  const totalPages = Math.ceil(questionsData.length / ITEMS_PER_PAGE);
  const currentQuestions = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return questionsData.slice(start, start + ITEMS_PER_PAGE);
  }, [page]);

  const handleAnswer = (qId, selectedLetter, isCorrect) => {
    // Basic tracking for this session
    setAnsweredCount(prev => prev + 1);
    if (isCorrect) setCorrectCount(prev => prev + 1);
  };

  return (
    <div>
      <div className="header-actions">
        <h1 className="page-title">All Questions</h1>
        <div className="stats-container">
          <div className="stat-box">
            <span className="stat-value">{answeredCount} / {questionsData.length}</span>
            <span className="stat-label">Answered</span>
          </div>
          <div className="stat-box">
            <span className="stat-value text-success" style={{ color: 'var(--color-success)' }}>
              {correctCount}
            </span>
            <span className="stat-label">Correct</span>
          </div>
        </div>
      </div>
      
      <div className="questions-container">
        {currentQuestions.map(q => (
          <QuestionCard 
            key={q.id} 
            question={q} 
            onAnswer={handleAnswer} 
          />
        ))}
      </div>
      
      <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
        <button 
          className="btn btn-secondary" 
          disabled={page === 1}
          onClick={() => { setPage(p => p - 1); window.scrollTo(0,0); }}
        >
          Previous
        </button>
        <span style={{ display: 'flex', alignItems: 'center', fontWeight: '500' }}>
          Page {page} / {totalPages}
        </span>
        <button 
          className="btn btn-secondary" 
          disabled={page === totalPages}
          onClick={() => { setPage(p => p + 1); window.scrollTo(0,0); }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
