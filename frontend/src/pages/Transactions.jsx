import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Plus,
  RefreshCw
} from 'lucide-react';
import { transactionAPI } from '../services/api';
import TransactionItem from '../components/TransactionItem';
import TransactionForm from '../components/TransactionForm';
import FloatingActionButton from '../components/FloatingActionButton';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    category: '',
    startDate: '',
    endDate: '',
    page: 1
  });
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionCount: 0
  });

  useEffect(() => {
    loadTransactions();
  }, [filters]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        page: filters.page,
        limit: 20,
        ...(filters.search && { search: filters.search }),
        ...(filters.type && { type: filters.type }),
        ...(filters.category && { category: filters.category }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      };

      const response = await transactionAPI.getTransactions(params);
      
      if (response.success) {
        setTransactions(response.data.transactions);
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setFilters(prev => ({
      ...prev,
      search: e.target.value,
      page: 1
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      category: '',
      startDate: '',
      endDate: '',
      page: 1
    });
  };

  const handleTransactionSuccess = (transaction) => {
    loadTransactions();
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = async (transaction) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await transactionAPI.deleteTransaction(transaction._id);
        loadTransactions();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Failed to delete transaction');
      }
    }
  };

  const handleView = (transaction) => {
    // For now, just edit the transaction
    // In the future, this could open a detailed view
    handleEdit(transaction);
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="h-full p-4 space-y-6 overflow-y-auto pb-20 bg-gray-100 dark:bg-gray-100">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl sm:text-4xl font-black text-black uppercase tracking-wider">Transactions</h1>
        <button 
          className="p-3 brutal-button brutal-shadow-hover animate-brutal-bounce disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={loadTransactions}
          disabled={loading}
        >
          <RefreshCw size={20} className={loading ? 'animate-brutal-pulse' : ''} />
        </button>
      </div>

      {/* Summary Cards hidden as requested */}

      {/* Filters */}
      <div className="brutal-card p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black font-bold" />
            <input
              type="text"
              placeholder="SEARCH TRANSACTIONS..."
              value={filters.search}
              onChange={handleSearch}
              className="w-full pl-10 pr-3 py-3 brutal-input font-bold uppercase tracking-wide focus-ring text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <button
              className={`px-4 py-2 font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce text-sm ${
                filters.type === '' 
                  ? 'bg-orange-500 text-black' 
                  : 'bg-white text-black'
              }`}
              onClick={() => handleFilterChange('type', '')}
            >
              All
            </button>
            <button
              className={`px-4 py-2 font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce text-sm ${
                filters.type === 'income' 
                  ? 'bg-green-500 text-black' 
                  : 'bg-white text-black'
              }`}
              onClick={() => handleFilterChange('type', 'income')}
            >
              Income
            </button>
            <button
              className={`px-4 py-2 font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce text-sm ${
                filters.type === 'expense' 
                  ? 'bg-red-500 text-black' 
                  : 'bg-white text-black'
              }`}
              onClick={() => handleFilterChange('type', 'expense')}
            >
              Expense
            </button>
            <div className="h-6 w-1 bg-black mx-2"></div>
            <div className="flex flex-col">
              <label className="text-xs font-black text-black mb-1 uppercase tracking-wide">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="px-3 py-2 brutal-input font-bold uppercase tracking-wide focus-ring appearance-none [color-scheme:light] dark:[color-scheme:dark] text-sm"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-black text-black mb-1 uppercase tracking-wide">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="px-3 py-2 brutal-input font-bold uppercase tracking-wide focus-ring appearance-none [color-scheme:light] dark:[color-scheme:dark] text-sm"
              />
            </div>
            {(filters.startDate || filters.endDate) && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-black font-bold">
                  Date filter: {filters.startDate || 'Any'} to {filters.endDate || 'Any'}
                </span>
                <button 
                  className="px-4 py-2 bg-red-500 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce text-sm"
                  onClick={clearFilters}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-12 h-12 bg-orange-500 brutal-border brutal-shadow animate-brutal-pulse"></div>
            <p className="text-black font-black text-lg uppercase tracking-wide">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-orange-500 brutal-border brutal-shadow flex items-center justify-center mx-auto mb-4">
              <TrendingUp size={32} className="text-black font-bold" />
            </div>
            <h3 className="text-2xl font-black text-black mb-3 uppercase tracking-wide">No transactions found</h3>
            <p className="text-black font-bold text-base mb-6">Start by adding your first transaction</p>
            <button 
              className="inline-flex items-center space-x-2 px-6 py-3 bg-orange-500 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce text-sm"
              onClick={() => setShowForm(true)}
            >
              <Plus size={20} />
              <span>Add Transaction</span>
            </button>
          </div>
        ) : (
          transactions.map(transaction => (
            <TransactionItem
              key={transaction._id}
              transaction={transaction}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
            />
          ))
        )}
      </div>

      {/* Transaction Form Modal */}
      <TransactionForm
        transaction={editingTransaction}
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingTransaction(null);
        }}
        onSuccess={handleTransactionSuccess}
      />

      {/* Floating Action Button */}
      <FloatingActionButton 
        onClick={() => setShowForm(true)}
        label="Add Transaction"
      />
    </div>
  );
};

export default Transactions;
