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
    <div className="h-full p-6 space-y-6 overflow-y-auto">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Learn</h1>
            <p className="text-gray-600 dark:text-gray-400">Practice quick finance quizzes and track progress.</p>
          </div>
        </div>
        <div className="mt-4 inline-flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <button onClick={()=>setActiveTab('quizzes')} className={`px-4 py-2 text-sm font-medium ${activeTab==='quizzes'?'bg-blue-600 text-white':'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>Quizzes</button>
          <button onClick={()=>setActiveTab('history')} className={`px-4 py-2 text-sm font-medium ${activeTab==='history'?'bg-blue-600 text-white':'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>History</button>
        </div>
      </div>

      {activeTab === 'quizzes' && !quiz && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Topic</label>
              <select value={topic} onChange={e=>setTopic(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                {topics.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty</label>
              <select value={difficulty} onChange={e=>setDifficulty(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                {diffs.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Length</label>
              <select value={length} onChange={e=>setLength(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value={5}>5</option>
                <option value={7}>7</option>
              </select>
            </div>
          </div>
          <button disabled={loading} onClick={startQuiz} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">Start</button>
        </div>
      )}

      {activeTab === 'quizzes' && quiz && !result && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-gray-700 dark:text-gray-300 text-sm">{quiz.topic} • {quiz.difficulty} • {quiz.questions.length} questions</div>
            <button onClick={()=>{setQuiz(null); setAnswers([]);}} className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">Change settings</button>
          </div>

          {quiz.questions.map((q, i) => (
            <div key={i} className="space-y-3">
              <div className="font-medium text-gray-900 dark:text-white">Q{i+1}. {q.text}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt, idx) => (
                  <button key={idx} onClick={()=>setAnswers(a=>{const c=[...a]; c[i]=idx; return c;})}
                    className={`text-left px-4 py-3 rounded-lg border ${answers[i]===idx? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300':'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'}`}>{opt}</button>
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <button disabled={loading} onClick={submit} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50">Submit</button>
          </div>
        </div>
      )}

      {activeTab === 'quizzes' && result && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">Score: {result.score}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Streak: {result.streak} day{result.streak===1?'':'s'}</div>
          </div>
          <div className="space-y-4">
            {result.breakdown.map((b, i) => {
              const isCorrect = b.userIndex === b.correctIndex;
              return (
                <div key={i} className={`rounded-lg p-4 border ${isCorrect ? 'bg-green-50 dark:bg-green-900/15 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/15 border-red-200 dark:border-red-800'}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-medium text-gray-900 dark:text-white">Q{i+1}. {b.text}</div>
                    <span className={`text-xs px-2 py-1 rounded-full ${isCorrect ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>{isCorrect ? 'Correct' : 'Incorrect'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {b.options.map((opt, idx) => {
                      const picked = idx === b.userIndex;
                      const correct = idx === b.correctIndex;
                      const base = 'w-full text-left px-3 py-2 rounded-md text-sm border';
                      const cls = correct
                        ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                        : picked
                          ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white';
                      return (
                        <div key={idx} className={`${base} ${cls}`}>{opt}</div>
                      );
                    })}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 mt-3">Explanation: {b.explanation}</div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={()=>{setQuiz(null); setResult(null);}} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">New quiz</button>
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


