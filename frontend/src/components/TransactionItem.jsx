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
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-4 cursor-pointer" onClick={() => onView(transaction)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
            <div 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
              style={{ backgroundColor: transaction.type === 'income' ? '#16a34a' : '#dc2626' }}
            >
              {transaction.type === 'income' ? (
                <TrendingUp size={18} className="sm:w-5 sm:h-5" />
              ) : (
                <TrendingDown size={18} className="sm:w-5 sm:h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 dark:text-white truncate text-sm sm:text-base">{transaction.title}</div>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md text-xs w-fit">
                  {transaction.category?.name || transaction.category}
                </span>
                <span className="text-xs sm:text-sm">{formatDate(transaction.date)}</span>
              </div>
              {transaction.description && (
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 italic truncate">
                  {transaction.description}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <div 
              className="text-sm sm:text-lg font-bold"
              style={{ color: getTypeColor(transaction.type) }}
            >
              <span className="text-xs sm:text-sm mr-1">{getTypeIcon(transaction.type)}</span>
              {formatAmount(transaction.amount)}
            </div>
            <button 
              className="p-1 sm:p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
            >
              <MoreVertical size={16} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {showActions && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex">
            <button 
              className="flex-1 flex items-center justify-center space-x-2 py-3 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
              onClick={() => {
                onEdit(transaction);
                setShowActions(false);
              }}
            >
              <Edit size={16} />
              <span className="text-sm font-medium">Edit</span>
            </button>
            <button 
              className="flex-1 flex items-center justify-center space-x-2 py-3 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
              onClick={() => {
                onDelete(transaction);
                setShowActions(false);
              }}
            >
              <Trash2 size={16} />
              <span className="text-sm font-medium">Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionItem;
