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
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="h-full p-6 space-y-6 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Overview</h1>
        <p className="text-gray-600 dark:text-gray-400">Quick summary of your finances.</p>
      </div>

      {/* Finance Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm border-l-4 border-l-green-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
              <TrendingUp size={24} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Income</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatAmount(summary.totalIncome)}</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm border-l-4 border-l-red-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
              <TrendingDown size={24} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Expense</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatAmount(summary.totalExpense)}</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm border-l-4 border-l-blue-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <TrendingUp size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Balance</div>
              <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatAmount(summary.balance)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
          <a href="/dashboard/transactions" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">View all</a>
        </div>
        {recent.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No recent transactions.</p>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recent.map((t) => (
              <div key={t._id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center ${t.type === 'income' ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>₹</div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{t.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 inline-flex items-center gap-1"><Calendar size={12} />{new Date(t.date).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className={`font-semibold ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatAmount(t.amount)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
