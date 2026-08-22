import { useState, useMemo } from 'react';
import questionsData from '../data/questions.json';
import QuestionCard from '../components/QuestionCard';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function PreparationMode() {
  const [expandedTopics, setExpandedTopics] = useState({});

  const topicMap = useMemo(() => {
    const map = {};
    questionsData.forEach(q => {
      const topic = q.topic || 'Other';
      if (!map[topic]) map[topic] = [];
      map[topic].push(q);
    });
    return map;
  }, []);

  const allTopics = Object.keys(topicMap).sort();

  const toggleTopic = (topic) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topic]: !prev[topic]
    }));
  };

  return (
    <div>
      <div className="header-actions" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Exam Preparation (Topics)</h1>
      </div>
      
      <div className="topics-container">
        {allTopics.map(topic => {
          const isExpanded = expandedTopics[topic];
          const questions = topicMap[topic];
          
          return (
            <div key={topic} className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <div 
                onClick={() => toggleTopic(topic)}
                style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: isExpanded ? '#f8fafc' : 'white' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {isExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                  <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>{topic}</span>
                </div>
                <span className="badge badge-primary" style={{ fontSize: '1rem', padding: '0.35rem 0.75rem' }}>
                  {questions.length} questions
                </span>
              </div>
              
              {isExpanded && (
                <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0', backgroundColor: '#f1f5f9' }}>
                  {questions.map(q => (
                    <QuestionCard key={q.id} question={q} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
