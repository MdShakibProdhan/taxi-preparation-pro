import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import QuestionBank from './pages/QuestionBank';
import ExclusiveMode from './pages/ExclusiveMode';
import StudyMode from './pages/StudyMode';
import PreparationMode from './pages/PreparationMode';
import ExamMode from './pages/ExamMode';
import RecoveryQuiz from './pages/RecoveryQuiz';

function App() {
  return (
    <BrowserRouter basename="/taxi-preparation-pro">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<QuestionBank />} />
          <Route path="exclusive" element={<ExclusiveMode />} />
          <Route path="study" element={<StudyMode />} />
          <Route path="preparation" element={<PreparationMode />} />
          <Route path="exam" element={<ExamMode />} />
          <Route path="recovery" element={<RecoveryQuiz />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
