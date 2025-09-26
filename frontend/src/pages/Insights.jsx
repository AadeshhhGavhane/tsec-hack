import { useEffect, useState } from 'react';
import { insightsAPI } from '../services/api';

const Insights = () => {
  const [data, setData] = useState({ monthly: [], topCategories: [] });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await insightsAPI.getSpending(6);
      if (res.success) setData(res.data);
    } finally { setLoading(false); }
  };

  useEffect(()=>{ load(); }, []);

  return (
    <div className="h-full p-6 space-y-6 overflow-y-auto">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Insights</h1>
        <p className="text-gray-600 dark:text-gray-400">Spending trends and top categories.</p>
      </div>
      {loading ? (
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="font-semibold text-gray-900 dark:text-white mb-3">Monthly spending (last 6 months)</div>
            <div className="grid grid-cols-6 gap-2">
              {data.monthly.map(m => (
                <div key={m.month} className="flex flex-col items-center">
                  <div className="h-24 w-6 bg-gray-100 dark:bg-gray-700 rounded flex items-end overflow-hidden">
                    <div style={{ height: `${Math.min(100, m.total ? (m.total / Math.max(...data.monthly.map(x=>x.total||1))) * 100 : 0)}%` }} className="w-full bg-blue-500"></div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{m.month}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="font-semibold text-gray-900 dark:text-white mb-3">Top categories</div>
            <ul className="space-y-2">
              {data.topCategories.map((c) => (
                <li key={c.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <span className="text-gray-800 dark:text-gray-200">{c.name}</span>
                  <span className="text-gray-900 dark:text-white font-medium">₹{Math.round(c.total).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default Insights;


