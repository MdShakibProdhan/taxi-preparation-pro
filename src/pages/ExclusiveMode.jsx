import { useState, useMemo } from 'react';
import questionsData from '../data/questions.json';
import QuestionCard from '../components/QuestionCard';

export default function ExclusiveMode() {
  const sources = [...new Set(questionsData.map(q => q.sourceFile))];
  const [selectedSource, setSelectedSource] = useState(sources[0] || '');
  const [page, setPage] = useState(1);
  
  const ITEMS_PER_PAGE = 50;
  
  const filteredQuestions = useMemo(() => {
    return questionsData.filter(q => q.sourceFile === selectedSource);
  }, [selectedSource]);
  
  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE);
  const currentQuestions = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredQuestions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredQuestions, page]);

  // Reset page when source changes
  const handleSourceChange = (e) => {
    setSelectedSource(e.target.value);
    setPage(1);
  };

  return (
    <div>
      <div className="header-actions">
        <h1 className="page-title">Exclusive Mode</h1>
        
        <select 
          value={selectedSource} 
          onChange={handleSourceChange}
          style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
        >
          {sources.map(src => (
            <option key={src} value={src}>{src}</option>
          ))}
        </select>
      </div>
      
      <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>
        Showing questions from source: <strong>{selectedSource}</strong> ({filteredQuestions.length} questions)
      </p>
      
      <div className="questions-container">
        {currentQuestions.map(q => (
          <QuestionCard key={q.id} question={q} />
        ))}
      </div>
      
      {totalPages > 1 && (
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
      )}
    </div>
  );
}
