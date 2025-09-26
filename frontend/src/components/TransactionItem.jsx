import { useState } from 'react';
import { Edit, Trash2, MoreVertical } from 'lucide-react';

const TransactionItem = ({ 
  transaction, 
  onEdit, 
  onDelete, 
  onView 
}) => {
  const [showActions, setShowActions] = useState(false);

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date) => {
    const transactionDate = new Date(date);
    
    // Check if the date is valid
    if (isNaN(transactionDate.getTime())) {
      return 'Invalid Date';
    }
    
    return transactionDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTypeColor = (type) => {
    return type === 'income' ? '#22c55e' : '#ef4444';
  };

  const getTypeIcon = (type) => {
    return type === 'income' ? '↗' : '↘';
  };

  return (
    <div className="transaction-item">
      <div className="transaction-main" onClick={() => onView(transaction)}>
        <div className="transaction-left">
          <div 
            className="category-icon"
            style={{ backgroundColor: transaction.category?.color || '#3b82f6' }}
          >
            {transaction.category?.icon || 'tag'}
          </div>
          <div className="transaction-details">
            <div className="transaction-title">{transaction.title}</div>
            <div className="transaction-meta">
              <span className="category-name">{transaction.category?.name}</span>
              <span className="transaction-date">{formatDate(transaction.date)}</span>
            </div>
            {transaction.description && (
              <div className="transaction-description">{transaction.description}</div>
            )}
          </div>
        </div>
        
        <div className="transaction-right">
          <div 
            className="transaction-amount"
            style={{ color: getTypeColor(transaction.type) }}
          >
            <span className="amount-type">{getTypeIcon(transaction.type)}</span>
            {formatAmount(transaction.amount)}
          </div>
          <button 
            className="action-button"
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {showActions && (
        <div className="transaction-actions">
          <button 
            className="action-btn edit"
            onClick={() => {
              onEdit(transaction);
              setShowActions(false);
            }}
          >
            <Edit size={16} />
            Edit
          </button>
          <button 
            className="action-btn delete"
            onClick={() => {
              onDelete(transaction);
              setShowActions(false);
            }}
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionItem;
