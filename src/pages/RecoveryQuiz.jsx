import { useState, useMemo } from 'react';
import QuestionCard from '../components/QuestionCard';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function RecoveryQuiz() {
  const [wrongAnswers, setWrongAnswers] = useLocalStorage('taxiExamWrongAnswers', {});
  
  // Convert object of wrong answers to array
  const wrongQuestions = useMemo(() => {
    return Object.values(wrongAnswers);
  }, [wrongAnswers]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const handleAnswer = (qId, selectedLetter, isCorrect) => {
    if (isCorrect) {
      // Remove from wrong answers list!
      setTimeout(() => {
        setWrongAnswers(prev => {
          const updated = { ...prev };
          delete updated[qId];
          return updated;
        });
        
        // If there are still items left, advance index (with wrap around)
        // If we just deleted the last item, index will naturally reset on render
        const newLen = wrongQuestions.length - 1;
        if (newLen > 0) {
          if (currentIndex >= newLen) {
            setCurrentIndex(0);
          }
        }
      }, 1500); // 1.5 second delay so user sees green before it disappears
    } else {
      // Answered wrong again, just move to next question after delay
      setTimeout(() => {
        if (wrongQuestions.length > 1) {
          setCurrentIndex((currentIndex + 1) % wrongQuestions.length);
        }
      }, 1500);
    }
  };

  if (wrongQuestions.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h1 className="page-title" style={{ marginBottom: '1.5rem', color: 'var(--color-success)' }}>Awesome! 🎉</h1>
        <p style={{ fontSize: '1.25rem', color: '#64748b' }}>
          You don't have any wrong answers in the review queue.
          Take practice exams to accumulate questions to review!
        </p>
      </div>
    );
  }

  const currentQ = wrongQuestions[currentIndex];

  return (
    <div>
      <div className="header-actions" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Review (Wrong Answers)</h1>
        
        <div className="badge badge-primary" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
          {wrongQuestions.length} questions remaining
        </div>
      </div>
      
      <p style={{ marginBottom: '2rem', color: '#64748b' }}>
        This mode repeats questions you previously answered incorrectly until you get them right.
      </p>

      {currentQ && (
        <QuestionCard 
          key={`recovery-${currentQ.id}-${currentIndex}`} // force remount when index changes
          question={currentQ} 
          onAnswer={handleAnswer} 
          isExamMode={false} 
        />
      )}
      
      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
        <button 
          className="btn btn-secondary"
          onClick={() => setCurrentIndex((currentIndex + 1) % wrongQuestions.length)}
        >
          Skip (Ask Later)
        </button>
      </div>
    </div>
  );
}
