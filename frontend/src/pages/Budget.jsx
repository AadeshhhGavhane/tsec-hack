import { useEffect, useState } from 'react';
import { insightsAPI } from '../services/api';

const Budget = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ categories: [] });

  useEffect(()=>{
    (async ()=>{
      try {
        setLoading(true);
        const res = await insightsAPI.getSpending(6);
        if (res.success) setData(res.data);
      } finally { setLoading(false); }
    })();
  }, []);

  const total = data.categories.reduce((a,c)=>a + c.total, 0) || 1;

  return (
    <div className="h-full p-6 space-y-6 overflow-y-auto">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Budget</h1>
        <p className="text-gray-600 dark:text-gray-400">Category-wise expense distribution</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="text-gray-600 dark:text-gray-400">Loading…</div>
        ) : data.categories.length === 0 ? (
          <div className="text-gray-600 dark:text-gray-400">No expense data.</div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="relative w-64 h-64">
              <div className="w-64 h-64 rounded-full" style={{
                background: `conic-gradient(${data.categories.map((c, i)=>`hsl(${(i*57)%360} 70% 50%) ${Math.round((data.categories.slice(0,i).reduce((a,x)=>a+x.total,0)/total)*360)}deg ${(Math.round((data.categories.slice(0,i+1).reduce((a,x)=>a+x.total,0)/total)*360))}deg`).join(', ')})`
              }}></div>
            </div>
            <ul className="flex-1 space-y-2">
              {data.categories.map((c, i)=> (
                <li key={c.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center gap-3">
                    <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor:`hsl(${(i*57)%360} 70% 50%)` }}></span>
                    <span className="text-gray-800 dark:text-gray-200">{c.name}</span>
                  </div>
                  <div className="text-gray-900 dark:text-white font-medium">₹{Math.round(c.total).toLocaleString()} ({Math.round((c.total/total)*100)}%)</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Budget;


