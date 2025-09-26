import { useEffect, useState } from 'react';
import { learnAPI } from '../services/api';
import LearnHistory from './LearnHistory';

const topics = ['Savings', 'Credit Score', 'Investing Basics', 'Budgeting'];
const diffs = ['Beginner', 'Intermediate', 'Advanced'];

const Learn = () => {
  const [activeTab, setActiveTab] = useState('quizzes'); // 'quizzes' | 'history'
  const [topic, setTopic] = useState(topics[0]);
  const [difficulty, setDifficulty] = useState(diffs[0]);
  const [length, setLength] = useState(5);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // get recommendation for prefill
    (async () => {
      try {
        const rec = await learnAPI.recommend();
        if (rec.success) {
          const r = rec.data.recommend;
          setTopic(r.topic);
          setDifficulty(r.difficulty);
          setLength(r.length);
        }
      } catch {}
    })();
  }, []);

  const startQuiz = async () => {
    setLoading(true);
    setQuiz(null);
    setResult(null);
    try {
      const res = await learnAPI.generateQuiz({ topic, difficulty, length });
      if (res.success) {
        setQuiz(res.data.quiz);
        setAnswers(new Array(res.data.quiz.questions.length).fill(null));
      } else {
        alert(res.message || 'Failed to generate quiz');
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!quiz) return;
    setLoading(true);
    try {
      const res = await learnAPI.submitQuiz(quiz._id, { answers: answers.map(a => (a ?? -1)) });
      if (res.success) setResult(res.data);
      else alert(res.message || 'Submit failed');
    } catch (e) {
      alert(e.response?.data?.message || 'Submit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="h-full p-4 space-y-6 overflow-y-auto" style={{ backgroundColor: 'var(--gray-light)' }}>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-black mb-3 uppercase tracking-wider">Learn</h1>
            <p className="text-black font-bold text-base">Practice quick finance quizzes and track progress.</p>
          </div>
        </div>
        <div className="mt-4 inline-flex brutal-shadow">
          <button onClick={()=>setActiveTab('quizzes')} className={`px-4 py-2 font-black uppercase tracking-wide brutal-button text-sm ${activeTab==='quizzes'?'bg-orange-500 text-black':'bg-white text-black'}`}>Quizzes</button>
          <button onClick={()=>setActiveTab('history')} className={`px-4 py-2 font-black uppercase tracking-wide brutal-button text-sm ${activeTab==='history'?'bg-orange-500 text-black':'bg-white text-black'}`}>History</button>
        </div>
      </div>

      {activeTab === 'quizzes' && !quiz && (
        <div className="brutal-card p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">Topic</label>
              <select value={topic} onChange={e=>setTopic(e.target.value)} className="w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide text-sm">
                {topics.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">Difficulty</label>
              <select value={difficulty} onChange={e=>setDifficulty(e.target.value)} className="w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide text-sm">
                {diffs.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">Length</label>
              <select value={length} onChange={e=>setLength(Number(e.target.value))} className="w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide text-sm">
                <option value={5}>5</option>
                <option value={7}>7</option>
              </select>
            </div>
          </div>
          <button disabled={loading} onClick={startQuiz} className="px-6 py-3 bg-orange-500 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce disabled:opacity-50 text-sm">Start</button>
        </div>
      )}

      {activeTab === 'quizzes' && quiz && !result && (
        <div className="brutal-card p-4 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-black font-bold text-sm">{quiz.topic} • {quiz.difficulty} • {quiz.questions.length} questions</div>
            <button onClick={()=>{setQuiz(null); setAnswers([]);}} className="px-3 py-2 bg-white text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce text-sm">Change Settings</button>
          </div>

          {quiz.questions.map((q, i) => (
            <div key={i} className="space-y-3">
              <div className="font-black text-black text-lg uppercase tracking-wide">Q{i+1}. {q.text}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {q.options.map((opt, idx) => (
                  <button key={idx} onClick={()=>setAnswers(a=>{const c=[...a]; c[i]=idx; return c;})}
                    className={`text-left px-4 py-3 font-bold uppercase tracking-wide text-sm ${
                      answers[i]===idx 
                        ? 'bg-white text-black border-black border-2 brutal-shadow' 
                        : 'bg-gray-100 text-black brutal-button'
                    }`}>{opt}</button>
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <button disabled={loading} onClick={submit} className="px-6 py-3 bg-green-500 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce disabled:opacity-50 text-sm">Submit</button>
          </div>
        </div>
      )}

      {activeTab === 'quizzes' && result && (
        <div className="brutal-card p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-2xl font-black text-black uppercase tracking-wide">Score: {result.score}%</div>
            <div className="text-sm font-bold text-black">Streak: {result.streak} day{result.streak===1?'':'s'}</div>
          </div>
          <div className="space-y-4">
            {result.breakdown.map((b, i) => {
              const isCorrect = b.userIndex === b.correctIndex;
              return (
                <div key={i} className={`brutal-card p-4 ${isCorrect ? 'bg-green-50 dark:bg-green-100' : 'bg-red-50 dark:bg-red-100'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div className="font-black text-black text-base uppercase tracking-wide">Q{i+1}. {b.text}</div>
                    <span className={`px-3 py-1 font-black uppercase tracking-wide brutal-button text-sm ${isCorrect ? 'bg-green-500 text-black' : 'bg-red-500 text-black'}`}>{isCorrect ? 'Correct' : 'Incorrect'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {b.options.map((opt, idx) => {
                      const picked = idx === b.userIndex;
                      const correct = idx === b.correctIndex;
                      let cls = 'px-3 py-2 font-bold uppercase tracking-wide text-sm ';
                      
                      if (correct) {
                        cls += 'bg-green-500 text-white border-2 border-green-600 brutal-shadow';
                      } else if (picked) {
                        cls += 'bg-red-500 text-white border-2 border-red-600 brutal-shadow';
                      } else {
                        cls += 'bg-white text-black brutal-button';
                      }
                      
                      return (
                        <div key={idx} className={cls}>{opt}</div>
                      );
                    })}
                  </div>
                  <div className="text-sm font-bold text-black mt-3">Explanation: {b.explanation}</div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={()=>{setQuiz(null); setResult(null);}} className="px-4 py-2 bg-orange-500 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce text-sm">New Quiz</button>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <LearnHistory />
      )}
    </div>
  );
};

export default Learn;


