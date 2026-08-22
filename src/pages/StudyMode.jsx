import { useState, useMemo } from 'react';
import questionsData from '../data/questions.json';
import QuestionCard from '../components/QuestionCard';
import { Search, ChevronDown, ChevronRight, Hash, Image as ImageIcon, Calendar } from 'lucide-react';

export default function StudyMode() {
  const [expandedSection, setExpandedSection] = useState(null);
  const [expandedKeyword, setExpandedKeyword] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const { solidMap, partialMap, age, numbers, image, solidQCount, partialQCount } = useMemo(() => {
    const sMap = {};
    const pMap = {};
    const ageArr = [];
    const numArr = [];
    const imgArr = [];
    const sSet = new Set();
    const pSet = new Set();

    questionsData.forEach(q => {
      if (q.confidenceKeywords) {
        q.confidenceKeywords.forEach(kw => {
          if (kw.confidence === 'solid') {
            if (!sMap[kw.term]) sMap[kw.term] = { translation: kw.translation, questions: [] };
            sMap[kw.term].questions.push(q);
            sSet.add(q.id);
          } else if (kw.confidence === 'partial') {
            if (!pMap[kw.term]) pMap[kw.term] = { translation: kw.translation, questions: [] };
            pMap[kw.term].questions.push(q);
            pSet.add(q.id);
          }
        });
      }

      if (q.specialPatterns) {
        if (q.specialPatterns.includes('age')) ageArr.push(q);
        if (q.specialPatterns.includes('numbers')) numArr.push(q);
        if (q.specialPatterns.includes('image')) imgArr.push(q);
      }
    });

    return { 
      solidMap: sMap, 
      partialMap: pMap, 
      age: ageArr, 
      numbers: numArr, 
      image: imgArr,
      solidQCount: sSet.size,
      partialQCount: pSet.size
    };
  }, []);

  const toggleSection = (sec) => {
    setExpandedSection(prev => prev === sec ? null : sec);
    setSearchTerm('');
  };

  const toggleKeyword = (kw) => {
    setExpandedKeyword(prev => ({
      ...prev,
      [kw]: !prev[kw]
    }));
  };

  const renderKeywordGroup = (map, title, tier, explanation, qCount) => {
    const allTerms = Object.keys(map).sort();
    const filteredTerms = searchTerm 
      ? allTerms.filter(t => t.toLowerCase().includes(searchTerm.toLowerCase()) || map[t].translation.toLowerCase().includes(searchTerm.toLowerCase()))
      : allTerms;

    const isExpanded = expandedSection === tier;

    return (
      <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div 
          onClick={() => toggleSection(tier)}
          style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: isExpanded ? '#f8fafc' : 'white' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {isExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
            <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>{title}</span>
          </div>
          <span className="badge badge-primary" style={{ fontSize: '1rem', padding: '0.35rem 0.75rem', backgroundColor: tier === 'solid' ? '#10b981' : '#f59e0b', color: 'white', border: 'none' }}>
            {qCount} questions
          </span>
        </div>

        {isExpanded && (
          <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0', backgroundColor: '#f1f5f9' }}>
            <h4 style={{ marginBottom: '0.5rem', color: '#334155' }}>Keywords [{allTerms.length} TOTAL]</h4>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.95rem' }}>{explanation}</p>
            
            <div style={{ marginBottom: '2rem', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '10px', left: '12px', color: '#64748b' }}><Search size={20} /></div>
              <input 
                type="text" 
                placeholder="Filter keywords..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredTerms.map(term => {
                const data = map[term];
                const kwExpanded = expandedKeyword[term];
                
                return (
                  <div key={term} style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
                    <div 
                      onClick={() => toggleKeyword(term)}
                      style={{ padding: '1rem', display: 'flex', alignItems: 'center', cursor: 'pointer', backgroundColor: kwExpanded ? '#f8fafc' : 'white' }}
                    >
                      <div style={{ marginRight: '12px', color: '#64748b' }}>
                        {kwExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{term}</span>
                        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{data.translation}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
                        {data.questions.map((_, i) => `Q${i + 1}`).join(' ')} ({data.questions.length})
                      </div>
                    </div>
                    
                    {kwExpanded && (
                      <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                        <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #bbf7d0', color: '#166534', fontSize: '0.9rem' }}>
                          <strong>Why is this a "{tier}" tier keyword?</strong><br/>
                          The word <strong>"{term}"</strong> appears in these questions {tier === 'solid' ? 'ONLY in the correct answer options. It is a 100% solid hint.' : 'primarily in the correct answer options, but it might occasionally be used in wrong options or the question itself.'}
                        </div>
                        
                        {data.questions.map(q => (
                          <QuestionCard key={q.id} question={q} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {filteredTerms.length === 0 && (
                <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>No keywords match your filter.</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPatternGroup = (questions, title, id, icon, color) => {
    if (questions.length === 0) return null;
    
    const isExpanded = expandedSection === id;

    return (
      <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div 
          onClick={() => toggleSection(id)}
          style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: isExpanded ? '#f8fafc' : 'white' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {isExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
            <div style={{ color, display: 'flex', alignItems: 'center' }}>{icon}</div>
            <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>{title}</span>
          </div>
          <span className="badge" style={{ fontSize: '1rem', padding: '0.35rem 0.75rem', backgroundColor: color, color: 'white', border: 'none' }}>
            {questions.length} questions
          </span>
        </div>

        {isExpanded && (
          <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0', backgroundColor: '#f1f5f9' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {questions.map(q => (
                <QuestionCard key={q.id} question={q} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="header-actions" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Study (Keywords and Patterns)</h1>
      </div>
      
      <p style={{ marginBottom: '2rem', color: '#64748b', fontSize: '1.1rem' }}>
        This section uses AI analysis to reveal recurring patterns and solid keywords directly from the exam material.
      </p>

      {Object.keys(solidMap).length > 0 && renderKeywordGroup(
        solidMap, 
        '1. Solid Keywords', 
        'solid', 
        `Practice ${solidQCount} questions where these words appear ONLY in the correct answer – never in wrong options or the question itself!`,
        solidQCount
      )}

      {Object.keys(partialMap).length > 0 && renderKeywordGroup(
        partialMap, 
        '2. Partial Keywords', 
        'partial', 
        `Practice ${partialQCount} questions where these words appear mostly in the correct answer, but might occasionally appear elsewhere.`,
        partialQCount
      )}

      {renderPatternGroup(age, '3. Age Rules', 'age', <Calendar size={24} />, '#6366f1')}
      {renderPatternGroup(numbers, '4. Numbers & Limits', 'numbers', <Hash size={24} />, '#ec4899')}
      {renderPatternGroup(image, '5. Image Sources', 'image', <ImageIcon size={24} />, '#14b8a6')}
      
    </div>
  );
}
