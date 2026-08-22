import fs from 'fs';
import path from 'path';
import { translate } from '@vitalets/google-translate-api';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../src/data/questions.json');

const questions = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

const fiStopwords = new Set([
  'ja', 'tai', 'vai', 'mutta', 'vaan', 'että', 'jotta', 'koska', 'kun', 'jos', 'vaikka', 'kuin',
  'on', 'ei', 'ole', 'ovat', 'eivät', 'oli', 'olivat', 'ollut', 'olisi',
  'se', 'ne', 'hän', 'he', 'joka', 'jotka', 'tämä', 'nämä', 'tuo', 'nuo',
  'sen', 'niiden', 'hänen', 'heidän', 'jonka', 'joiden', 'tämän', 'näiden', 'tuon', 'noiden',
  'sitä', 'niitä', 'häntä', 'heitä', 'jota', 'joita', 'tätä', 'näitä', 'tuota', 'noita',
  'siinä', 'niissä', 'hänessä', 'heissä', 'jossa', 'joissa', 'tässä', 'näissä', 'tuossa', 'noissa',
  'siihen', 'niihin', 'häneen', 'heihin', 'johon', 'joihin', 'tähän', 'näihin', 'tuohon', 'noihin',
  'siitä', 'niistä', 'hänestä', 'heistä', 'josta', 'joista', 'tästä', 'näistä', 'tuosta', 'noista',
  'sillä', 'niillä', 'hänellä', 'heillä', 'jolla', 'joilla', 'tällä', 'näillä', 'tuolla', 'noilla',
  'sille', 'niille', 'hänelle', 'heille', 'jolle', 'joille', 'tälle', 'näille', 'tuolle', 'noille',
  'siltä', 'niiltä', 'häneltä', 'heiltä', 'jolta', 'joilta', 'tältä', 'näiltä', 'tuolta', 'noilta',
  'vain', 'myös', 'aina', 'koskaan', 'kaikki', 'mitään', 'kukaan', 'mikään', 'joku', 'jokin',
  'saa', 'voi', 'pitää', 'tulee', 'täytyy', 'voidaan', 'saadaan', 'pitäisi', 'olisi',
  'sekä', 'kuitenkin', 'sitten', 'niin', 'näin', 'kuin', 'että', 'mukaan', 'vasta', 'asti',
  'mikä', 'mitä', 'kuka', 'ketkä', 'kuinka', 'miten', 'miksi', 'milloin', 'missä', 'mistä', 'mihin',
  'seuraavista', 'oikein', 'väärin', 'koskee', 'jälkeen', 'ennen', 'ilman', 'oleva', 'olevat'
]);

function tokenize(text) {
  const words = text.toLowerCase().replace(/[.,!?;:()\[\]"'\n]/g, ' ').split(/\s+/);
  return words.filter(w => w.length > 3 && !fiStopwords.has(w) && isNaN(w));
}

// 1. Keyword Confidence Scoring
const wordStats = {}; 

questions.forEach(q => {
  const qTokens = new Set(tokenize(q.question));
  qTokens.forEach(w => {
    if (!wordStats[w]) wordStats[w] = { inCorrectOpt: new Set(), inWrongOpt: new Set(), inQuestion: new Set() };
    wordStats[w].inQuestion.add(q.id);
  });
  
  q.options.forEach(opt => {
    const isCorrect = (opt.label === q.correctAnswer);
    const tokens = new Set(tokenize(opt.text));
    tokens.forEach(w => {
      if (!wordStats[w]) wordStats[w] = { inCorrectOpt: new Set(), inWrongOpt: new Set(), inQuestion: new Set() };
      if (isCorrect) wordStats[w].inCorrectOpt.add(q.id);
      else wordStats[w].inWrongOpt.add(q.id);
    });
  });
});

let extractedKeywords = [];
for (const [w, stats] of Object.entries(wordStats)) {
  const correctCount = stats.inCorrectOpt.size;
  const wrongCount = stats.inWrongOpt.size;
  const questionCount = stats.inQuestion.size;
  
  if (correctCount === 0) continue; 
  
  const totalOccurrences = correctCount + wrongCount + questionCount;
  const correctRatio = correctCount / totalOccurrences;
  
  let confidence = null;
  if (wrongCount === 0 && questionCount === 0) {
    confidence = 'solid';
  } else if (correctRatio >= 0.70) {
    confidence = 'partial';
  }
  
  if (confidence) {
    extractedKeywords.push({ term: w, confidence, relatedQuestionIds: Array.from(stats.inCorrectOpt) });
  }
}

// 2. Special Patterns
let patternCounts = { numbers: 0, age: 0, image: 0 };

questions.forEach(q => {
  q.specialPatterns = [];
  
  const correctOpt = q.options.find(o => o.label === q.correctAnswer);
  if (correctOpt && /\d+/.test(correctOpt.text)) {
    q.specialPatterns.push('numbers');
  } else if (/\d+/.test(q.question) && (q.options.some(o => /\d+/.test(o.text)))) {
    q.specialPatterns.push('numbers');
  }
  
  const fullText = (q.question + " " + q.options.map(o => o.text).join(" ")).toLowerCase();
  if (/\b(ikä|vuotta|vuotias|vuotiaat|iän)\b/.test(fullText)) {
    q.specialPatterns.push('age');
  }
  
  if (q.originalImageHeader && q.originalImageHeader.toLowerCase().includes('image')) {
    q.specialPatterns.push('image');
  } else if (q.question.toLowerCase().includes('kuvassa') || q.question.toLowerCase().includes('merkki')) {
    q.specialPatterns.push('image'); 
  }
  
  if (q.specialPatterns.includes('numbers')) patternCounts.numbers++;
  if (q.specialPatterns.includes('age')) patternCounts.age++;
  if (q.specialPatterns.includes('image')) patternCounts.image++;
});

const delay = ms => new Promise(res => setTimeout(res, ms));

let isApiBlocked = false;

async function safeTranslate(text) {
  if (isApiBlocked) {
    return `[Translation API Blocked] ${text}`;
  }
  
  try {
    const res = await translate(text, { to: 'en' });
    return res.text;
  } catch (err) {
    if (err.message && err.message.includes('Too Many Requests')) {
      console.warn("API Rate limited! Switching to instant fallback mode.");
      isApiBlocked = true;
      return `[Translation API Blocked] ${text}`;
    }
    console.warn("Translation error, retrying in 5s...", err.message);
    await delay(5000);
    try {
      const res2 = await translate(text, { to: 'en' });
      return res2.text;
    } catch (e2) {
      console.error("Failed again, falling back to original");
      return `[Translation failed] ${text}`;
    }
  }
}

async function runAnalysis() {
  console.log(`Extracted ${extractedKeywords.length} candidate keywords.`);
  const solidCount = extractedKeywords.filter(k => k.confidence === 'solid').length;
  console.log(`Solid: ${solidCount}, Partial: ${extractedKeywords.length - solidCount}`);
  console.log(`Patterns - Numbers: ${patternCounts.numbers}, Age: ${patternCounts.age}, Image: ${patternCounts.image}`);
  
  console.log("Starting batched translations...");
  
  // Translate keywords in batches
  const keywordBatchSize = 100;
  for (let i = 0; i < extractedKeywords.length; i += keywordBatchSize) {
    const batch = extractedKeywords.slice(i, i + keywordBatchSize);
    const combinedStr = batch.map(k => k.term).join(' ||| ');
    console.log(`Translating keywords batch ${i/keywordBatchSize + 1}...`);
    const translatedStr = await safeTranslate(combinedStr);
    const translatedParts = translatedStr.split('|||').map(s => s.trim());
    
    batch.forEach((k, idx) => {
      k.translation = translatedParts[idx] || k.term;
    });
    await delay(1000);
  }
  
  // We need to store keywords inside the question object for the frontend
  questions.forEach(q => {
    q.confidenceKeywords = extractedKeywords.filter(k => k.relatedQuestionIds.includes(q.id)).map(k => ({
      term: k.term,
      translation: k.translation,
      confidence: k.confidence
    }));
  });
  
  // Translate Questions (batching 20 at a time)
  // Format: QID ||| QuestionText ||| OptALabel: OptAText ||| OptBLabel: OptBText ||||
  console.log("Translating questions in batches...");
  const qBatchSize = 10;
  
  // Load cache to resume if crashed
  let translatedData = [];
  const cachePath = path.join(__dirname, '../src/data/questions_translated.json');
  if (fs.existsSync(cachePath)) {
    translatedData = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    console.log(`Found cache with ${translatedData.length} translated questions.`);
  }
  
  for (let i = 0; i < questions.length; i += qBatchSize) {
    if (i < translatedData.length) continue; // Skip already translated
    
    const batch = questions.slice(i, i + qBatchSize);
    
    let combinedStr = batch.map(q => {
      let str = `Q_ID_START ${q.question} Q_OPTS `;
      str += q.options.map(o => `${o.label}_LABEL_START ${o.text}`).join(' ');
      return str;
    }).join(' Q_SEP ');
    
    console.log(`Translating questions ${i} to ${i + batch.length}...`);
    const translatedStr = await safeTranslate(combinedStr);
    
    const qParts = translatedStr.split('Q_SEP');
    
    batch.forEach((q, idx) => {
      let tStr = qParts[idx] || '';
      
      let [tQuest, tOptsStr] = tStr.split('Q_OPTS');
      tQuest = (tQuest || '').replace('Q_ID_START', '').trim();
      
      let tOptions = [];
      q.options.forEach(o => {
        let regex = new RegExp(`${o.label}_LABEL_START(.*?)(?=[A-E]_LABEL_START|$)`, 's');
        let match = (tOptsStr || '').match(regex);
        let optText = match ? match[1].trim() : o.text;
        tOptions.push({ label: o.label, text: optText });
      });
      
      q.englishTranslation = {
        question: tQuest || q.question,
        options: tOptions
      };
    });
    
    translatedData.push(...batch);
    fs.writeFileSync(cachePath, JSON.stringify(translatedData, null, 2));
    
    if (!isApiBlocked) {
      await delay(1500); 
    }
  }
  
  fs.writeFileSync(dataPath, JSON.stringify(translatedData, null, 2));
  console.log("Analysis and translation complete!");
}

runAnalysis();
