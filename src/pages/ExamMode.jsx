import { useState, useEffect, useMemo } from 'react';
import questionsData from '../data/questions.json';
import QuestionCard from '../components/QuestionCard';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function ExamMode() {
  const [examState, setExamState] = useState('setup'); // 'setup', 'running', 'results'
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  
  // Track wrong answers for Recovery mode
  const [wrongAnswers, setWrongAnswers] = useLocalStorage('taxiExamWrongAnswers', {});

  // Setup Exam
  const startExam = (questionCount = 30) => {
    // Random sample
    const shuffled = [...questionsData].sort(() => 0.5 - Math.random());
    setQuestions(shuffled.slice(0, questionCount));
    setCurrentIndex(0);
    setAnswers({});
    setFlagged({});
    setTimeLeft(45 * 60);
    setExamState('running');
  };

  // Timer
  useEffect(() => {
    if (examState !== 'running') return;
    
    if (timeLeft <= 0) {
      finishExam();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [examState, timeLeft]);

  const handleAnswer = (qId, letter, isCorrect) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: { letter, isCorrect }
    }));
  };

  const toggleFlag = (qId) => {
    setFlagged(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishExam();
    }
  };
  
  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }

  const finishExam = () => {
    // Record wrong answers
    const newWrong = { ...wrongAnswers };
    questions.forEach(q => {
      const ans = answers[q.id];
      if (!ans || !ans.isCorrect) {
        newWrong[q.id] = q; // save the question object so recovery mode can render it
      }
    });
    setWrongAnswers(newWrong);
    
    setExamState('results');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (examState === 'setup') {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '3rem 2rem' }}>
        <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>Practice Exam</h1>
        <p style={{ marginBottom: '2rem', color: '#64748b' }}>
          Test your knowledge in an environment matching the real exam situation. 
          The exam has a time limit (45 minutes). You can skip questions and flag them for review.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn" onClick={() => startExam(30)}>Start Exam (30 Questions)</button>
          <button className="btn btn-secondary" onClick={() => startExam(50)}>Start Exam (50 Questions)</button>
        </div>
      </div>
    );
  }

  if (examState === 'results') {
    const correctCount = Object.values(answers).filter(a => a.isCorrect).length;
    const percentage = Math.round((correctCount / questions.length) * 100);
    const passed = percentage >= 80;
    
    return (
      <div>
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', marginBottom: '2rem' }}>
          <h1 className="page-title">Results</h1>
          
          <div style={{ fontSize: '4rem', fontWeight: 700, color: passed ? 'var(--color-success)' : 'var(--color-danger)', margin: '1rem 0' }}>
            {percentage}%
          </div>
          
          <p style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '2rem' }}>
            You got {correctCount} correct out of {questions.length} questions.
          </p>
          
          <button className="btn" onClick={() => setExamState('setup')}>Try Again</button>
        </div>
        
        <h2 style={{ marginBottom: '1.5rem' }}>Wrong Answers</h2>
        <div className="questions-container">
          {questions.map(q => {
            const ans = answers[q.id];
            if (ans && ans.isCorrect) return null; // Skip correct
            
            return (
              <div key={q.id} style={{ opacity: 0.8 }}>
                <QuestionCard 
                  question={q} 
                  isExamMode={false}
                  forceShowAnswer={true}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Running State
  const currentQ = questions[currentIndex];
  
  return (
    <div>
      <div className="header-actions" style={{ marginBottom: '1.5rem', backgroundColor: 'white', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
          Question {currentIndex + 1} / {questions.length}
        </div>
        <div style={{ color: timeLeft < 300 ? 'var(--color-danger)' : 'inherit', fontWeight: 700, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⏳ {formatTime(timeLeft)}
        </div>
      </div>
      
      <QuestionCard 
        key={currentQ.id} // Forces re-render for new question
        question={currentQ} 
        onAnswer={handleAnswer} 
        isExamMode={true} 
      />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        <button 
          className="btn btn-secondary" 
          onClick={prevQuestion}
          disabled={currentIndex === 0}
        >
          Previous
        </button>
        
        <button 
          className={`btn ${flagged[currentQ.id] ? 'btn-secondary' : 'btn-secondary'}`}
          style={{ backgroundColor: flagged[currentQ.id] ? '#fef3c7' : 'white', borderColor: flagged[currentQ.id] ? '#f59e0b' : '#cbd5e1' }}
          onClick={() => toggleFlag(currentQ.id)}
        >
          {flagged[currentQ.id] ? '🚩 Flagged' : 'Flag for review'}
        </button>
        
        <button 
          className="btn" 
          onClick={nextQuestion}
        >
          {currentIndex === questions.length - 1 ? 'Submit Exam' : 'Next'}
        </button>
      </div>
      
      {/* Progress Map */}
      <div style={{ marginTop: '3rem', padding: '1.5rem', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#64748b' }}>Exam Progress</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {questions.map((q, idx) => {
            let bg = 'white';
            let border = '#cbd5e1';
            let color = '#64748b';
            
            if (idx === currentIndex) {
              border = 'var(--color-primary)';
              bg = '#f0fdfa';
              color = 'var(--color-primary)';
            } else if (answers[q.id]) {
              bg = 'var(--color-primary)';
              border = 'var(--color-primary)';
              color = 'white';
            }
            
            if (flagged[q.id]) {
              border = '#f59e0b';
              if (!answers[q.id]) bg = '#fffbeb';
            }
            
            return (
              <div 
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '6px', border: `2px solid ${border}`, backgroundColor: bg, color,
                  fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer'
                }}
              >
                {idx + 1}
              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
}
