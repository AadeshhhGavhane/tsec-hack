import { useState, useEffect } from 'react';
import { 
  PiggyBank, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Target,
  ArrowUpRight,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { roundUpAPI, financialGoalsAPI } from '../services/api';
import FloatingActionButton from '../components/FloatingActionButton';

const RoundUp = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [trend, setTrend] = useState([]);
  const [recentRoundUps, setRecentRoundUps] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState('');
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    loadRoundUpData();
  }, []);

  const loadRoundUpData = async () => {
    try {
      setLoading(true);
      const [summaryResponse, trendResponse, recentResponse, settingsResponse] = await Promise.all([
        roundUpAPI.getSummary(6),
        roundUpAPI.getTrend(12),
        roundUpAPI.getRecent(20),
        roundUpAPI.getSettings()
      ]);

      if (summaryResponse.success) {
        setSummary(summaryResponse.data.summary);
      }

      if (trendResponse.success) {
        setTrend(trendResponse.data.trend);
      }

      if (recentResponse.success) {
        setRecentRoundUps(recentResponse.data.roundUps);
      }

      if (settingsResponse.success) {
        setSavingsGoals(settingsResponse.data.savingsGoals);
      }
    } catch (error) {
      console.error('Error loading round-up data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    try {
      setTransferring(true);
      const response = await roundUpAPI.transfer(selectedGoal || null);
      
      if (response.success) {
        alert(`Successfully transferred ₹${response.data.transferredAmount} to savings!`);
        setShowTransferModal(false);
        setSelectedGoal('');
        await loadRoundUpData();
      } else {
        alert(response.message || 'Failed to transfer round-ups');
      }
    } catch (error) {
      console.error('Transfer error:', error);
      alert('Failed to transfer round-ups');
    } finally {
      setTransferring(false);
    }
  };

  const formatAmount = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'transferred':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'pending':
        return <Clock size={16} className="text-orange-600" />;
      case 'failed':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'transferred':
        return 'bg-green-50 dark:bg-green-100';
      case 'pending':
        return 'bg-orange-50 dark:bg-orange-100';
      case 'failed':
        return 'bg-red-50 dark:bg-red-100';
      default:
        return 'bg-gray-50 dark:bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <div className="w-16 h-16 bg-orange-500 brutal-border brutal-shadow animate-brutal-pulse"></div>
        <p className="text-black font-black text-xl uppercase tracking-wide">Loading round-up data...</p>
      </div>
    );
  }

  return (
    <div className="h-full p-4 space-y-6 overflow-y-auto" style={{ backgroundColor: 'var(--gray-light)' }}>
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-black text-black mb-3 uppercase tracking-wider">Round-up Savings</h1>
        <p className="text-black font-bold text-lg">Save automatically by rounding up your expenses.</p>
      </div>

      {/* Round-up Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="brutal-card p-4 bg-green-50 dark:bg-green-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 brutal-border brutal-shadow flex items-center justify-center">
              <PiggyBank size={24} className="text-black font-bold" />
            </div>
            <div>
              <div className="text-sm font-black text-black uppercase tracking-wide">Total Saved</div>
              <div className="text-xl font-black text-black">{formatAmount(summary.totalRoundUps)}</div>
            </div>
          </div>
        </div>
        
        <div className="brutal-card p-4 bg-blue-50 dark:bg-blue-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 brutal-border brutal-shadow flex items-center justify-center">
              <TrendingUp size={24} className="text-black font-bold" />
            </div>
            <div>
              <div className="text-sm font-black text-black uppercase tracking-wide">Transactions</div>
              <div className="text-xl font-black text-black">{summary.totalTransactions || 0}</div>
            </div>
          </div>
        </div>
        
        <div className="brutal-card p-4 bg-orange-50 dark:bg-orange-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500 brutal-border brutal-shadow flex items-center justify-center">
              <Clock size={24} className="text-black font-bold" />
            </div>
            <div>
              <div className="text-sm font-black text-black uppercase tracking-wide">Pending</div>
              <div className="text-xl font-black text-black">{formatAmount(summary.pendingAmount)}</div>
            </div>
          </div>
        </div>
        
        <div className="brutal-card p-4 bg-purple-50 dark:bg-purple-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500 brutal-border brutal-shadow flex items-center justify-center">
              <CheckCircle size={24} className="text-black font-bold" />
            </div>
            <div>
              <div className="text-sm font-black text-black uppercase tracking-wide">Transferred</div>
              <div className="text-xl font-black text-black">{formatAmount(summary.transferredAmount)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Pending Round-ups */}
      {summary.pendingAmount > 0 && (
        <div className="brutal-card p-4 bg-orange-50 dark:bg-orange-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 brutal-border brutal-shadow flex items-center justify-center">
                <ArrowUpRight size={20} className="text-black font-bold" />
              </div>
              <div>
                <h3 className="text-lg font-black text-black uppercase tracking-wide">Transfer Pending Savings</h3>
                <p className="text-black font-bold">You have {formatAmount(summary.pendingAmount)} waiting to be transferred to your savings goal.</p>
              </div>
            </div>
            <button
              onClick={() => setShowTransferModal(true)}
              className="px-4 py-2 bg-orange-500 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce"
            >
              Transfer Now
            </button>
          </div>
        </div>
      )}

      {/* Round-up Trend Chart */}
      {trend.length > 0 && (
        <div className="brutal-card p-4">
          <div className="text-lg font-black text-black mb-4 uppercase tracking-wide">Round-up Trend (12 Months)</div>
          <div className="grid grid-cols-12 gap-2">
            {trend.slice(-12).map((month, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="h-24 w-6 bg-gray-100 dark:bg-gray-700 rounded flex items-end overflow-hidden">
                  <div 
                    style={{ 
                      height: `${Math.min(100, (month.totalRoundUps / Math.max(...trend.map(t => t.totalRoundUps))) * 100)}%` 
                    }} 
                    className="w-full bg-green-500"
                    title={`${month.month}: ${formatAmount(month.totalRoundUps)}`}
                  ></div>
                </div>
                <div className="text-xs text-black font-bold mt-1">
                  {new Date(month.month + '-01').toLocaleDateString('en-IN', { month: 'short' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Round-ups */}
      <div className="brutal-card p-4">
        <div className="text-lg font-black text-black mb-4 uppercase tracking-wide">Recent Round-ups</div>
        {recentRoundUps.length > 0 ? (
          <div className="space-y-3">
            {recentRoundUps.map((roundUp) => (
              <div key={roundUp._id} className={`p-3 brutal-card ${getStatusColor(roundUp.status)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(roundUp.status)}
                    <div>
                      <div className="font-black text-black text-sm uppercase tracking-wide">
                        {roundUp.transactionId?.title || 'Transaction'}
                      </div>
                      <div className="text-xs text-black font-bold">
                        {new Date(roundUp.createdAt).toLocaleDateString('en-IN')} • 
                        {roundUp.savingsGoalId?.title || 'General Savings'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-black text-sm">
                      +{formatAmount(roundUp.roundUpAmount)}
                    </div>
                    <div className="text-xs text-black font-bold capitalize">
                      {roundUp.status}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 brutal-border brutal-shadow flex items-center justify-center mx-auto mb-4">
              <PiggyBank size={32} className="text-gray-500" />
            </div>
            <h3 className="text-lg font-black text-black mb-2 uppercase tracking-wide">No Round-ups Yet</h3>
            <p className="text-black font-bold">Start adding expenses with round-up enabled to see your savings grow!</p>
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="brutal-card w-full max-w-md" style={{ backgroundColor: 'var(--white)' }}>
            <div className="flex items-center justify-between p-4 brutal-border-b-3">
              <h2 className="text-lg font-black text-black uppercase tracking-wider">Transfer Round-ups</h2>
              <button 
                className="p-2 brutal-button brutal-shadow-hover animate-brutal-bounce"
                onClick={() => setShowTransferModal(false)}
              >
                ×
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="text-center">
                <div className="text-2xl font-black text-black mb-2">
                  {formatAmount(summary.pendingAmount)}
                </div>
                <p className="text-black font-bold">Available to transfer</p>
              </div>

              <div>
                <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
                  Transfer to Savings Goal
                </label>
                <select
                  value={selectedGoal}
                  onChange={(e) => setSelectedGoal(e.target.value)}
                  className="w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide text-sm"
                >
                  <option value="">Auto-create Round-up Savings Goal</option>
                  {savingsGoals.map(goal => (
                    <option key={goal._id} value={goal._id}>
                      {goal.title} ({formatAmount(goal.currentAmount)} / {formatAmount(goal.targetAmount)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  className="flex-1 px-3 py-2 bg-white text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce"
                  onClick={() => setShowTransferModal(false)}
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={transferring}
                  className="flex-1 px-3 py-2 bg-orange-500 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {transferring ? (
                    <div className="w-4 h-4 bg-orange-500 brutal-border brutal-shadow animate-brutal-pulse"></div>
                  ) : (
                    <span>Transfer</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <FloatingActionButton 
        onClick={() => setShowTransferModal(true)}
        label="Transfer Savings"
        disabled={summary.pendingAmount <= 0}
      />
    </div>
  );
};

export default RoundUp;
