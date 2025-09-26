import { useEffect, useMemo, useState } from 'react';
import { budgetAPI } from '../services/api';

const monthStr = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;

const Budget = () => {
  const [month, setMonth] = useState(monthStr());
  const [income, setIncome] = useState(50000);
  const [targetSavingsPct, setTargetSavingsPct] = useState(10);
  const [method, setMethod] = useState('50-30-20');
  const [allocations, setAllocations] = useState([]);
  const [mtd, setMtd] = useState({});
  const [loading, setLoading] = useState(false);
  const [recs, setRecs] = useState([]);
  const [savedBanner, setSavedBanner] = useState('');

  const totals = useMemo(() => {
    const allocated = allocations.reduce((a,c)=>a + Number(c.amount||0),0);
    const savings = Math.round((Number(income||0) * Number(targetSavingsPct||0))/100);
    const remaining = Number(income||0) - allocated - savings;
    return { allocated, savings, remaining };
  }, [allocations, income, targetSavingsPct]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await budgetAPI.current(month);
      if (res.success && res.data.plan) {
        const p = res.data.plan;
        setIncome(p.income); setTargetSavingsPct(p.targetSavingsPct); setMethod(p.method); setAllocations(p.allocations);
        setMtd(res.data.mtd||{});
      } else {
        const gen = await budgetAPI.generate({ month, income, targetSavingsPct, method });
        if (gen.success) { setAllocations(gen.data.plan.allocations); setMtd(gen.data.mtd||{}); }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setAmt = (idx, val) => setAllocations(a=>{const c=[...a]; c[idx] = { ...c[idx], amount: Math.max(0, Number(val)||0) }; return c;});

  const save = async () => {
    setLoading(true);
    try {
      const res = await budgetAPI.save({ month, method, income: Number(income||0), targetSavingsPct: Number(targetSavingsPct||0), allocations: allocations.map(a=>({ ...a, pct: income ? Math.round((a.amount/ Number(income))*100):0 })) });
      if (!res.success) {
        alert(res.message||'Failed to save');
      } else {
        const p = res.data.plan;
        if (p) {
          setIncome(p.income);
          setTargetSavingsPct(p.targetSavingsPct);
          setMethod(p.method);
          setAllocations(p.allocations||[]);
        }
        setSavedBanner('Plan saved');
        setTimeout(()=>setSavedBanner(''), 2000);
      }
    } finally { setLoading(false); }
  };

  const getRecommendations = async () => {
    try {
      setLoading(true);
      const payload = { month, income: Number(income||0), targetSavingsPct: Number(targetSavingsPct||0), allocations: allocations.map(a=>({ category: a.category, amount: Number(a.amount||0) })) };
      const res = await budgetAPI.recommend(payload);
      if (res.success) setRecs(res.data.changes||[]);
    } catch (e) {
      alert('Failed to load recommendations');
    } finally { setLoading(false); }
  };

  const applyChange = (chg, idx) => {
    setAllocations(a=>a.map(x=> x.category===chg.category ? { ...x, amount: Math.max(0, Number(x.amount)+Number(chg.deltaAmount)) } : x));
    setRecs(list => list.filter((_, i) => i !== idx));
  };

  const applyAll = () => { recs.forEach((c)=>{
    setAllocations(a=>a.map(x=> x.category===c.category ? { ...x, amount: Math.max(0, Number(x.amount)+Number(c.deltaAmount)) } : x));
  }); setRecs([]); };

  return (
    <div className="h-full p-6 space-y-6 overflow-y-auto pb-24">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Budget</h1>
        <p className="text-gray-600 dark:text-gray-400">Plan your month with simple sliders. Mobile-first.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Month</label>
            <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Income</label>
            <input type="number" value={income} onChange={e=>setIncome(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Save</label>
            <div className="flex gap-2">
              {[10,15,20].map(p=> (
                <button key={p} onClick={()=>setTargetSavingsPct(p)} className={`px-3 py-2 rounded-lg text-sm ${targetSavingsPct===p?'bg-blue-600 text-white':'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>{p}%</button>
              ))}
              <input type="number" value={targetSavingsPct} onChange={e=>setTargetSavingsPct(Number(e.target.value)||0)} className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Method</label>
            <div className="flex gap-2">
              {['50-30-20','Zero-based'].map(m=> (
                <button key={m} onClick={()=>setMethod(m)} className={`px-3 py-2 rounded-lg text-sm ${method===m?'bg-purple-600 text-white':'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>{m}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {allocations.map((a, idx)=> (
          <div key={a.category} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-gray-900 dark:text-white">{a.category}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">MTD: ₹{(mtd[a.category]||0).toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-3">
              <input type="range" min={0} max={income} value={a.amount} onChange={e=>setAmt(idx, e.target.value)} className="flex-1" />
              <input type="number" value={a.amount} onChange={e=>setAmt(idx, e.target.value)} className="w-28 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-gray-900 dark:text-white">Recommendations</div>
          <div className="flex gap-2">
            <button onClick={getRecommendations} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">Refresh</button>
            <button onClick={applyAll} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Accept all</button>
          </div>
        </div>
        {recs.length === 0 ? (
          <div className="text-sm text-gray-600 dark:text-gray-400">No suggestions yet. Tap Refresh.</div>
        ) : (
          <ul className="space-y-2">
            {recs.map((c, i)=> (
              <li key={i} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-800 dark:text-gray-200 flex-1">
                  <div className="font-medium">{c.category} {c.deltaAmount>=0?'+':'-'}₹{Math.abs(c.deltaAmount).toLocaleString()}</div>
                  <div className="text-gray-600 dark:text-gray-400">{c.reason}</div>
                </div>
                <button onClick={()=>applyChange(c, i)} className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">Accept</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="fixed left-0 right-0 bottom-0 z-40 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 grid grid-cols-3 gap-2 text-sm">
            <div className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800"><div className="text-gray-600 dark:text-gray-400">Allocated</div><div className="font-semibold text-gray-900 dark:text-white">₹{totals.allocated.toLocaleString()}</div></div>
            <div className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800"><div className="text-gray-600 dark:text-gray-400">Savings</div><div className="font-semibold text-gray-900 dark:text-white">₹{totals.savings.toLocaleString()} ({targetSavingsPct}%)</div></div>
            <div className={`px-3 py-2 rounded-lg ${totals.remaining>=0?'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300':'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}><div>Remaining</div><div className="font-semibold">₹{totals.remaining.toLocaleString()}</div></div>
          </div>
          <button disabled={loading} onClick={save} className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">Save plan</button>
          {savedBanner && (
            <div className="text-sm px-3 py-2 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300">{savedBanner}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Budget;


