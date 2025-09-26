import { useState, useEffect } from 'react';
import { X, Calendar, Tag, DollarSign, Type } from 'lucide-react';
import { transactionAPI, categoryAPI } from '../services/api';

const TransactionForm = ({ 
  transaction = null, 
  onClose, 
  onSuccess,
  isOpen = false 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (transaction) {
        setFormData({
          title: transaction.title || '',
          amount: transaction.amount || '',
          category: transaction.category || '',
          type: transaction.type || 'expense',
          date: transaction.date ? new Date(transaction.date).toLocaleDateString('en-CA') : new Date().toLocaleDateString('en-CA'),
          description: transaction.description || ''
        });
      } else {
        setFormData({
          title: '',
          amount: '',
          category: '',
          type: 'expense',
          date: new Date().toLocaleDateString('en-CA'),
          description: ''
        });
      }
    }
  }, [isOpen, transaction]);

  // Load categories when formData.type changes
  useEffect(() => {
    if (isOpen && formData.type) {
      loadCategories();
    }
  }, [formData.type, isOpen]);

  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getCategories(formData.type);
      if (response.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear category selection when type changes
    if (name === 'type') {
      setFormData(prev => ({
        ...prev,
        category: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const transactionData = {
        title: formData.title.trim(),
        amount: parseFloat(formData.amount),
        category: formData.category,
        type: formData.type,
        date: formData.date,
        description: formData.description.trim()
      };

      let response;
      if (transaction) {
        response = await transactionAPI.updateTransaction(transaction._id, transactionData);
      } else {
        response = await transactionAPI.createTransaction(transactionData);
      }
      
      if (response.success) {
        onSuccess(response.data.transaction);
        onClose();
      }
    } catch (error) {
      console.error('Transaction error:', error);
      setErrors({ submit: 'Failed to save transaction' });
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (value) => {
    // Remove any non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    return numericValue;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content transaction-form">
        <div className="modal-header">
          <h2>{transaction ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="transaction-form-content">
          {errors.submit && (
            <div className="error-banner">
              {errors.submit}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              <Type size={16} />
              Type *
            </label>
            <div className="type-buttons">
              <button
                type="button"
                className={`type-button ${formData.type === 'expense' ? 'active' : ''}`}
                onClick={() => handleChange({ target: { name: 'type', value: 'expense' } })}
              >
                Expense
              </button>
              <button
                type="button"
                className={`type-button ${formData.type === 'income' ? 'active' : ''}`}
                onClick={() => handleChange({ target: { name: 'type', value: 'income' } })}
              >
                Income
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Type size={16} />
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`form-input ${errors.title ? 'error' : ''}`}
              placeholder="Enter transaction title"
              maxLength={100}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              <DollarSign size={16} />
              Amount (₹) *
            </label>
            <input
              type="text"
              name="amount"
              value={formData.amount}
              onChange={(e) => {
                const formatted = formatAmount(e.target.value);
                handleChange({ target: { name: 'amount', value: formatted } });
              }}
              className={`form-input ${errors.amount ? 'error' : ''}`}
              placeholder="0.00"
            />
            {errors.amount && <span className="error-message">{errors.amount}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              <Tag size={16} />
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`form-input ${errors.category ? 'error' : ''}`}
            >
              <option value="">Select category</option>
              {categories.map(category => (
                <option key={category._id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category && <span className="error-message">{errors.category}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              <Calendar size={16} />
              Date *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="form-input"
              max={new Date().toLocaleDateString('en-CA')}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input"
              placeholder="Optional description"
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <div className="spinner-small"></div>
              ) : (
                transaction ? 'Update' : 'Add Transaction'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
