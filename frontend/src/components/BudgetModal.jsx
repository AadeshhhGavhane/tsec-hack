import { useState, useEffect } from 'react';
import { X, DollarSign, AlertTriangle, Calendar } from 'lucide-react';
import { categoryBudgetAPI } from '../services/api';

const BudgetModal = ({ 
  category, 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    budgetAmount: '',
    period: 'monthly',
    alertThreshold: 80
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [existingBudget, setExistingBudget] = useState(null);

  useEffect(() => {
    if (isOpen && category) {
      loadExistingBudget();
    }
  }, [isOpen, category]);

  const loadExistingBudget = async () => {
    try {
      const response = await categoryBudgetAPI.getBudgets();
      if (response.success) {
        const budget = response.data.budgets.find(b => b.categoryId._id === category._id);
        if (budget) {
          setExistingBudget(budget);
          setFormData({
            budgetAmount: budget.budgetAmount.toString(),
            period: budget.period,
            alertThreshold: budget.alertThreshold
          });
        } else {
          setExistingBudget(null);
          setFormData({
            budgetAmount: '',
            period: 'monthly',
            alertThreshold: 80
          });
        }
      }
    } catch (error) {
      console.error('Error loading existing budget:', error);
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
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.budgetAmount.trim()) {
      newErrors.budgetAmount = 'Budget amount is required';
    } else if (parseFloat(formData.budgetAmount) <= 0) {
      newErrors.budgetAmount = 'Budget amount must be greater than 0';
    }

    if (formData.alertThreshold < 0 || formData.alertThreshold > 100) {
      newErrors.alertThreshold = 'Alert threshold must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const budgetData = {
        categoryId: category._id,
        budgetAmount: parseFloat(formData.budgetAmount),
        period: formData.period,
        alertThreshold: parseInt(formData.alertThreshold)
      };

      let response;
      if (existingBudget) {
        response = await categoryBudgetAPI.updateBudget(existingBudget._id, budgetData);
      } else {
        response = await categoryBudgetAPI.createBudget(budgetData);
      }
      
      if (response.success) {
        onSuccess(response.data.budget);
        onClose();
      }
    } catch (error) {
      console.error('Budget error:', error);
      setErrors({ submit: 'Failed to save budget' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingBudget) return;
    
    if (!window.confirm('Are you sure you want to delete this budget?')) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await categoryBudgetAPI.deleteBudget(existingBudget._id);
      if (response.success) {
        onSuccess(null); // Signal that budget was deleted
        onClose();
      }
    } catch (error) {
      console.error('Delete budget error:', error);
      alert('Failed to delete budget');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="brutal-card w-full max-w-md" style={{ backgroundColor: 'var(--white)' }}>
        <div className="flex items-center justify-between p-4 brutal-border-b-3">
          <h2 className="text-lg font-black text-black uppercase tracking-wider">
            {existingBudget ? 'Edit Budget' : 'Set Budget'} - {category.name}
          </h2>
          <button 
            className="p-2 brutal-button brutal-shadow-hover animate-brutal-bounce"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-100 brutal-card px-3 py-2 text-sm font-bold text-black">
              {errors.submit}
            </div>
          )}

          <div>
            <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
              <DollarSign size={16} className="inline mr-2" />
              Budget Amount (₹) *
            </label>
            <input
              type="number"
              name="budgetAmount"
              value={formData.budgetAmount}
              onChange={handleChange}
              className={`w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide focus-ring text-sm ${
                errors.budgetAmount 
                  ? 'bg-red-50 dark:bg-red-100' 
                  : ''
              }`}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
            {errors.budgetAmount && <p className="mt-1 text-sm text-black font-bold">{errors.budgetAmount}</p>}
          </div>

          <div>
            <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
              <Calendar size={16} className="inline mr-2" />
              Period
            </label>
            <select
              name="period"
              value={formData.period}
              onChange={handleChange}
              className="w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide focus-ring text-sm"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
              <AlertTriangle size={16} className="inline mr-2" />
              Alert Threshold (%)
            </label>
            <input
              type="number"
              name="alertThreshold"
              value={formData.alertThreshold}
              onChange={handleChange}
              className={`w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide focus-ring text-sm ${
                errors.alertThreshold 
                  ? 'bg-red-50 dark:bg-red-100' 
                  : ''
              }`}
              placeholder="80"
              min="0"
              max="100"
            />
            <p className="mt-1 text-xs text-black font-bold">
              Get notified when you've spent this percentage of your budget
            </p>
            {errors.alertThreshold && <p className="mt-1 text-sm text-black font-bold">{errors.alertThreshold}</p>}
          </div>

          <div className="flex space-x-3 pt-4">
            {existingBudget && (
              <button
                type="button"
                className="flex-1 px-3 py-2 bg-red-500 text-white font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </button>
            )}
            <button
              type="button"
              className="flex-1 px-3 py-2 bg-white text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-3 py-2 bg-orange-500 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
            >
              {loading ? (
                <div className="w-4 h-4 bg-orange-500 brutal-border brutal-shadow animate-brutal-pulse"></div>
              ) : (
                <span>{existingBudget ? 'Update' : 'Set Budget'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetModal;
