import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIRS = [
  'Konok Bhai',
  'Rakib Bhai',
  'Rifat Bhai',
  'Shaikat Bhai',
  'Mehedi Bhai'
];

const BASE_DIR = path.join(__dirname, '../..'); 
// script is in taxi-exam-app/scripts, so ../../.. is Desktop/Taxi Materials

const keywordRules = [
  { words: ['asiakas', 'matkustaja', 'palvelu', 'avust', 'kohtelu'], tag: 'asiakaspalvelu', topic: 'Asiakaspalvelu ja Erityisryhmät' },
  { words: ['opaskoira', 'pyörätuoli', 'esteetön', 'vamma', 'erityis'], tag: 'esteettömyys', topic: 'Asiakaspalvelu ja Erityisryhmät' },
  { words: ['turva', 'vyö', 'onnettomuus', 'hätä', 'poliisi', 'pelastus', 'vaara', 'alko', 'humala'], tag: 'turvallisuus', topic: 'Turvallisuus ja Hätätilanteet' },
  { words: ['sakko', 'laki', 'sääntö', 'lupa', 'taksilupa', 'liikennelupa', 'rangaistus', 'rikos'], tag: 'lainsäädäntö', topic: 'Taksisääntely ja Talous' },
  { words: ['hinta', 'maksu', 'mittari', 'kuitti', 'tariffi', 'kassa', 'vero', 'kirjanpito'], tag: 'talous', topic: 'Taksisääntely ja Talous' },
  { words: ['auto', 'rengas', 'huolto', 'katsastus', 'ajoneuvo', 'varuste', 'valo', 'jarrut'], tag: 'ajoneuvo', topic: 'Ajoneuvotekniikka ja Liikennesäännöt' },
  { words: ['kartta', 'reitti', 'osoite', 'navigointi', 'tie', 'liikenne', 'nopeus', 'risteys', 'pysäköinti', 'suojatie'], tag: 'liikennesäännöt', topic: 'Ajoneuvotekniikka ja Liikennesäännöt' }
];

function analyzeText(text) {
  const lowerText = text.toLowerCase();
  let keywords = new Set();
  let topicCounts = {};
  
  for (const rule of keywordRules) {
    if (rule.words.some(w => lowerText.includes(w))) {
      keywords.add(rule.tag);
      topicCounts[rule.topic] = (topicCounts[rule.topic] || 0) + 1;
    }
  }
  
  if (keywords.size === 0) {
    keywords.add('yleistieto');
    topicCounts['Ajoneuvotekniikka ja Liikennesäännöt'] = 1; // Default
  }
  
  // Find top topic
  let topTopic = Object.keys(topicCounts).reduce((a, b) => topicCounts[a] > topicCounts[b] ? a : b);
  
  return { keywords: Array.from(keywords).slice(0, 3), topic: topTopic };
}

let allQuestions = [];
let failedCount = 0;

function parseMarkdownFile(filePath, sourceName) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  let currentImageHeader = null;
  let qNumberLine = null;
  let qTextLines = [];
  let optionsRaw = [];
  let explanationLines = [];
  let state = 'out';
  let oikeaVastausLetter = null;
  
  const saveCurrentQuestion = () => {
    if (state === 'out' || qTextLines.length === 0 || optionsRaw.length === 0) {
      if (state !== 'out' && (qTextLines.length === 0 || optionsRaw.length === 0)) {
         failedCount++;
      }
      return;
    }
    
    const questionText = qTextLines.join('\n').trim();
    if (!questionText || optionsRaw.length === 0) {
      failedCount++;
      return;
    }
    
    const options = [];
    let correctAnswer = null;
    
    optionsRaw.forEach((optObj, index) => {
      const letter = String.fromCharCode(65 + index); // A, B, C, D
      
      let text = optObj.text;
      let isCorrect = false;
      
      if (optObj.type === 'checkbox') {
        isCorrect = text.startsWith('- [x]');
        text = text.replace('- [x]', '').replace('- [ ]', '').trim();
      } else if (optObj.type === 'letter') {
        isCorrect = (letter === oikeaVastausLetter);
        text = text.replace(/^- [A-E]\)\s*/, '').trim();
      }
      
      options.push({ label: letter, text });
      if (isCorrect) correctAnswer = letter;
    });
    
    if (!correctAnswer && options.length > 0) {
      correctAnswer = 'A';
    }
    
    let explanation = explanationLines.join('\n').trim();
    let aiDetermined = explanation.length > 0;
    
    const fullTextForAnalysis = questionText + " " + options.map(o => o.text).join(' ');
    const { keywords, topic } = analyzeText(fullTextForAnalysis);
    
    const id = crypto.createHash('md5').update(sourceName + (qNumberLine || '') + questionText).digest('hex').substring(0, 10);
    
    allQuestions.push({
      id,
      sourceFile: sourceName,
      originalImageHeader: currentImageHeader,
      question: questionText,
      options,
      correctAnswer,
      aiDetermined,
      explanation: aiDetermined ? explanation : null,
      keywords,
      topic,
      specialPatterns: []
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    
    if (trimmed.startsWith('## ')) {
      currentImageHeader = trimmed.substring(3).trim();
      continue;
    }
    
    if (trimmed.startsWith('### Kysymys ')) {
      saveCurrentQuestion(); // Save previous if exists
      
      qNumberLine = trimmed.replace('### Kysymys ', '').trim();
      qTextLines = [];
      optionsRaw = [];
      explanationLines = [];
      state = 'question';
      oikeaVastausLetter = null;
      continue;
    }
    
    if (state === 'out') continue;
    
    if (trimmed.startsWith('- [x]') || trimmed.startsWith('- [ ]')) {
      state = 'options';
      optionsRaw.push({ type: 'checkbox', text: trimmed });
    } else if (trimmed.match(/^- [A-E]\)/)) {
      state = 'options';
      optionsRaw.push({ type: 'letter', text: trimmed });
    } else if (trimmed.startsWith('**Oikea vastaus:')) {
      state = 'options';
      const match = trimmed.match(/\*\*Oikea vastaus:\s*([A-E])\*\*/i) || trimmed.match(/\*\*Oikea vastaus:\s*([A-E])/i);
      if (match) {
        oikeaVastausLetter = match[1].toUpperCase();
      }
    } else if (trimmed.startsWith('> ⚠️') || trimmed.includes('⚠️ Tekoälyn päättelemä vastaus')) {
      state = 'explanation';
      explanationLines.push(trimmed.replace('> ', ''));
    } else {
      if (state === 'question') {
        if (trimmed) qTextLines.push(trimmed);
      } else if (state === 'explanation') {
        if (trimmed) explanationLines.push(trimmed.replace('> ', ''));
      }
    }
  }
  
  saveCurrentQuestion(); // Save last question
}

for (let dir of DATA_DIRS) {
  const filePath = path.join(BASE_DIR, dir, `${dir}.md`);
  parseMarkdownFile(filePath, dir);
}

const outDir = path.join(__dirname, '../src/data');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'questions.json'), JSON.stringify(allQuestions, null, 2));

console.log(`Successfully parsed ${allQuestions.length} questions.`);
if (failedCount > 0) {
  console.log(`WARNING: Failed to parse ${failedCount} questions cleanly.`);
}
