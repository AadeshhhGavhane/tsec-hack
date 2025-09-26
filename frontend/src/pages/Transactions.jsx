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
    <div className="transactions-page">
      <div className="page-header">
        <h1>Transactions</h1>
        <button 
          className="refresh-button"
          onClick={loadTransactions}
          disabled={loading}
        >
          <RefreshCw size={20} className={loading ? 'spinning' : ''} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card income">
          <div className="summary-icon">
            <TrendingUp size={24} />
          </div>
          <div className="summary-content">
            <div className="summary-label">Total Income</div>
            <div className="summary-value">{formatAmount(summary.totalIncome)}</div>
          </div>
        </div>
        
        <div className="summary-card expense">
          <div className="summary-icon">
            <TrendingDown size={24} />
          </div>
          <div className="summary-content">
            <div className="summary-label">Total Expense</div>
            <div className="summary-value">{formatAmount(summary.totalExpense)}</div>
          </div>
        </div>
        
        <div className="summary-card balance">
          <div className="summary-icon">
            <TrendingUp size={24} />
          </div>
          <div className="summary-content">
            <div className="summary-label">Balance</div>
            <div className={`summary-value ${summary.balance >= 0 ? 'positive' : 'negative'}`}>
              {formatAmount(summary.balance)}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={filters.search}
            onChange={handleSearch}
            className="search-input"
          />
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-button ${filters.type === '' ? 'active' : ''}`}
            onClick={() => handleFilterChange('type', '')}
          >
            All
          </button>
          <button
            className={`filter-button ${filters.type === 'income' ? 'active' : ''}`}
            onClick={() => handleFilterChange('type', 'income')}
          >
            Income
          </button>
          <button
            className={`filter-button ${filters.type === 'expense' ? 'active' : ''}`}
            onClick={() => handleFilterChange('type', 'expense')}
          >
            Expense
          </button>
        </div>

        <div className="date-filters">
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="date-input"
            placeholder="Start date"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="date-input"
            placeholder="End date"
          />
          {(filters.startDate || filters.endDate) && (
            <button className="clear-filters" onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Transactions List */}
      <div className="transactions-list">
        {loading ? (
          <div className="loading-state">
            <div className="spinner-large"></div>
            <p>Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <TrendingUp size={48} />
            </div>
            <h3>No transactions found</h3>
            <p>Start by adding your first transaction</p>
            <button 
              className="add-first-button"
              onClick={() => setShowForm(true)}
            >
              <Plus size={20} />
              Add Transaction
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
