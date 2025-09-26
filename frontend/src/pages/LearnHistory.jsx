import { useEffect, useState } from 'react';
import { learnAPI } from '../services/api';

const LearnHistory = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await learnAPI.getHistory();
      if (res.success) setAttempts(res.data.attempts || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAttempt = async (id) => {
    try {
      const res = await learnAPI.getAttempt(id);
      if (res.success) setReport(res.data);
    } catch (e) {
      alert('Failed to load attempt');
    }
  };

  return (
    <div className="h-full p-6 space-y-6 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quiz History</h1>
        <p className="text-gray-600 dark:text-gray-400">Review your past attempts and answers.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-6 text-gray-600 dark:text-gray-400">Loading...</div>
        ) : attempts.length === 0 ? (
          <div className="p-6 text-gray-600 dark:text-gray-400">No attempts yet.</div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {attempts.map(a => (
              <li key={a._id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Score: {a.score}%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{new Date(a.createdAt).toLocaleString()}</div>
                </div>
                <button onClick={() => openAttempt(a._id)} className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">View</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {report && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-gray-700 dark:text-gray-300">{report.quiz.topic} • {report.quiz.difficulty} • {report.quiz.length} questions</div>
            <div className="text-gray-900 dark:text-white font-semibold">Score: {report.score}%</div>
          </div>
          <div className="space-y-4">
            {report.report.map((r, i) => (
              <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="font-medium text-gray-900 dark:text-white mb-2">Q{i+1}. {r.text}</div>
                <ul className="space-y-1 text-sm">
                  {r.options.map((opt, idx) => (
                    <li key={idx} className={`${idx===r.correctIndex?'text-green-600 dark:text-green-400':''} ${idx===r.userIndex && idx!==r.correctIndex?'text-red-600 dark:text-red-400':''}`}>• {opt}</li>
                  ))}
                </ul>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Your answer: {r.userIndex>=0?r.options[r.userIndex]:'—'}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Explanation: {r.explanation}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={()=>setReport(null)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearnHistory;


