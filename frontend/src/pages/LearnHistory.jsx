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
    <div className="h-full p-4 space-y-4 overflow-y-auto bg-gray-100 dark:bg-gray-100">
      <div className="mb-4">
        <h1 className="text-2xl font-black text-black uppercase tracking-wider">Quiz History</h1>
        <p className="text-black font-bold text-sm">Review your past attempts and answers.</p>
      </div>

      <div className="brutal-card">
        {loading ? (
          <div className="p-4 text-black font-bold text-sm">Loading...</div>
        ) : attempts.length === 0 ? (
          <div className="p-4 text-black font-bold text-sm">No attempts yet.</div>
        ) : (
          <div className="space-y-3">
            {attempts.map(a => (
              <div key={a._id} className="p-4 brutal-card bg-orange-50 dark:bg-orange-100 flex items-center justify-between">
                <div>
                  <div className="font-black text-black text-sm uppercase tracking-wide">Score: {a.score}%</div>
                  <div className="text-xs text-black font-bold">{new Date(a.createdAt).toLocaleString()}</div>
                </div>
                <button onClick={() => openAttempt(a._id)} className="px-3 py-2 bg-orange-500 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce text-sm">View</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {report && (
        <div className="brutal-card p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-black font-bold text-sm">{report.quiz.topic} • {report.quiz.difficulty} • {report.quiz.length} questions</div>
            <div className="text-black font-black text-sm uppercase tracking-wide">Score: {report.score}%</div>
          </div>
          <div className="space-y-4">
            {report.report.map((r, i) => (
              <div key={i} className="brutal-card p-4 bg-orange-50 dark:bg-orange-100">
                <div className="font-black text-black text-sm uppercase tracking-wide mb-3">Q{i+1}. {r.text}</div>
                <div className="space-y-2 mb-3">
                  {r.options.map((opt, idx) => {
                    const isCorrect = idx === r.correctIndex;
                    const isPicked = idx === r.userIndex;
                    let cls = 'px-3 py-2 font-bold uppercase tracking-wide text-xs ';
                    
                    if (isCorrect) {
                      cls += 'bg-green-500 text-white border-2 border-green-600 brutal-shadow';
                    } else if (isPicked) {
                      cls += 'bg-red-500 text-white border-2 border-red-600 brutal-shadow';
                    } else {
                      cls += 'bg-white text-black brutal-button';
                    }
                    
                    return (
                      <div key={idx} className={cls}>• {opt}</div>
                    );
                  })}
                </div>
                <div className="text-xs text-black font-bold mb-2">Your answer: {r.userIndex>=0?r.options[r.userIndex]:'—'}</div>
                <div className="text-xs text-black font-bold">Explanation: {r.explanation}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={()=>setReport(null)} className="px-4 py-2 bg-orange-500 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce text-sm">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearnHistory;


