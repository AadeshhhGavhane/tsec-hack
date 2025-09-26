import { useState } from 'react';
import { Edit, Trash2, MoreVertical, TrendingUp, TrendingDown } from 'lucide-react';

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
    <div className="brutal-card bg-orange-50 dark:bg-orange-100 brutal-shadow-hover transition-all duration-200 overflow-hidden">
      <div className="p-4 cursor-pointer" onClick={() => onView(transaction)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div 
              className="w-10 h-10 brutal-border brutal-shadow flex items-center justify-center text-black font-bold flex-shrink-0"
              style={{ backgroundColor: transaction.type === 'income' ? '#22c55e' : '#ef4444' }}
            >
              {transaction.type === 'income' ? (
                <TrendingUp size={20} />
              ) : (
                <TrendingDown size={20} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-black truncate text-sm uppercase tracking-wide">{transaction.title}</div>
              <div className="flex flex-col gap-1 text-xs text-black font-bold mt-1">
                <span className="bg-white px-2 py-1 brutal-border brutal-shadow text-xs font-black uppercase tracking-wide w-fit">
                  {transaction.category?.name || transaction.category}
                </span>
                <span className="text-xs">{formatDate(transaction.date)}</span>
              </div>
              {transaction.description && (
                <div className="text-xs text-black font-bold mt-1 italic truncate">
                  {transaction.description}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div 
              className="text-sm font-black"
              style={{ color: getTypeColor(transaction.type) }}
            >
              <span className="text-xs mr-1">{getTypeIcon(transaction.type)}</span>
              {formatAmount(transaction.amount)}
            </div>
            <button 
              className="p-2 brutal-button brutal-shadow-hover animate-brutal-bounce"
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
            >
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
      </div>

      {showActions && (
        <div className="brutal-border-t-3 bg-orange-100 dark:bg-orange-200">
          <div className="flex">
            <button 
              className="flex-1 flex items-center justify-center space-x-2 py-3 bg-orange-500 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce text-sm"
              onClick={() => {
                onEdit(transaction);
                setShowActions(false);
              }}
            >
              <Edit size={16} />
              <span>Edit</span>
            </button>
            <button 
              className="flex-1 flex items-center justify-center space-x-2 py-3 bg-red-500 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce text-sm"
              onClick={() => {
                onDelete(transaction);
                setShowActions(false);
              }}
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionItem;
