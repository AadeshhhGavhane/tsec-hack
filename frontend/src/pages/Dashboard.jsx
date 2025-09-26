import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { transactionAPI } from '../services/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await transactionAPI.getTransactions({ page: 1, limit: 5 });
        if (response.success) {
          setSummary(response.data.summary ?? { totalIncome: 0, totalExpense: 0, balance: 0 });
          setRecent(response.data.transactions ?? []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatAmount = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount || 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <div className="w-16 h-16 bg-orange-500 brutal-border brutal-shadow animate-brutal-pulse"></div>
        <p className="text-black font-black text-xl uppercase tracking-wide">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="h-full p-4 space-y-6 overflow-y-auto" style={{ backgroundColor: 'var(--gray-light)' }}>
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-black text-black mb-3 uppercase tracking-wider">Overview</h1>
        <p className="text-black font-bold text-lg">Quick summary of your finances.</p>
      </div>

      {/* Finance Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="brutal-card p-4 bg-green-50 dark:bg-green-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 brutal-border brutal-shadow flex items-center justify-center">
              <TrendingUp size={24} className="text-black font-bold" />
            </div>
            <div>
              <div className="text-sm font-black text-black uppercase tracking-wide">Total Income</div>
              <div className="text-xl font-black text-black">{formatAmount(summary.totalIncome)}</div>
            </div>
          </div>
        </div>
        <div className="brutal-card p-4 bg-red-50 dark:bg-red-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500 brutal-border brutal-shadow flex items-center justify-center">
              <TrendingDown size={24} className="text-black font-bold" />
            </div>
            <div>
              <div className="text-sm font-black text-black uppercase tracking-wide">Total Expense</div>
              <div className="text-xl font-black text-black">{formatAmount(summary.totalExpense)}</div>
            </div>
          </div>
        </div>
        <div className="brutal-card p-4 bg-orange-50 dark:bg-orange-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500 brutal-border brutal-shadow flex items-center justify-center">
              <TrendingUp size={24} className="text-black font-bold" />
            </div>
            <div>
              <div className="text-sm font-black text-black uppercase tracking-wide">Balance</div>
              <div className={`text-xl font-black ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatAmount(summary.balance)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="brutal-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-black uppercase tracking-wide">Recent Transactions</h3>
          <a href="/dashboard/transactions" className="px-3 py-2 bg-orange-500 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce text-sm">View All</a>
        </div>
        {recent.length === 0 ? (
          <p className="text-black font-bold text-base">No recent transactions.</p>
        ) : (
          <div className="space-y-3">
            {recent.map((t) => (
              <div key={t._id} className="py-3 px-4 brutal-card bg-orange-50 dark:bg-orange-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 brutal-border brutal-shadow flex items-center justify-center font-black text-sm ${t.type === 'income' ? 'bg-green-500 text-black' : 'bg-red-500 text-black'}`}>₹</div>
                  <div>
                    <div className="font-black text-black text-sm uppercase tracking-wide">{t.title}</div>
                    <div className="text-xs text-black font-bold inline-flex items-center gap-1"><Calendar size={12} />{new Date(t.date).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className={`font-black text-lg ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{formatAmount(t.amount)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
