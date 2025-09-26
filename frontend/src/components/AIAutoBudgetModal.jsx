import { useState, useEffect } from 'react';
import { X, Brain, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { aiBudgetAPI } from '../services/api';

const AIAutoBudgetModal = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  availableBalance 
}) => {
  const [formData, setFormData] = useState({
    availableBalance: '',
    preferences: ''
  });
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && availableBalance) {
      setFormData(prev => ({
        ...prev,
        availableBalance: availableBalance.toString()
      }));
    }
  }, [isOpen, availableBalance]);

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

    if (!formData.availableBalance.trim()) {
      newErrors.availableBalance = 'Available balance is required';
    } else if (parseFloat(formData.availableBalance) <= 0) {
      newErrors.availableBalance = 'Available balance must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGetSuggestions = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});
    
    try {
      const response = await aiBudgetAPI.suggest(parseFloat(formData.availableBalance));
      if (response.success) {
        setSuggestions(response.data.suggestions);
        setShowSuggestions(true);
      } else {
        setErrors({ submit: response.message || 'Failed to get AI suggestions' });
      }
    } catch (error) {
      console.error('AI suggestions error:', error);
      setErrors({ submit: 'Failed to get AI suggestions' });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAllocate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});
    
    try {
      const response = await aiBudgetAPI.autoAllocate(
        parseFloat(formData.availableBalance),
        formData.preferences.trim() || undefined
      );
      
      if (response.success) {
        onSuccess(response.data);
        onClose();
      } else {
        setErrors({ submit: response.message || 'Failed to allocate budgets' });
      }
    } catch (error) {
      console.error('Auto allocate error:', error);
      setErrors({ submit: 'Failed to allocate budgets' });
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="brutal-card w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--white)' }}>
        <div className="flex items-center justify-between p-4 brutal-border-b-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 brutal-border brutal-shadow flex items-center justify-center">
              <Brain size={20} className="text-white font-bold" />
            </div>
            <h2 className="text-lg font-black text-black uppercase tracking-wider">
              AI Auto-Budget
            </h2>
          </div>
          <button 
            className="p-2 brutal-button brutal-shadow-hover animate-brutal-bounce"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-100 brutal-card px-3 py-2 text-sm font-bold text-black flex items-center gap-2">
              <AlertCircle size={16} />
              {errors.submit}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
                <DollarSign size={16} className="inline mr-2" />
                Available Balance (₹) *
              </label>
              <input
                type="number"
                name="availableBalance"
                value={formData.availableBalance}
                onChange={handleChange}
                className={`w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide focus-ring text-sm ${
                  errors.availableBalance 
                    ? 'bg-red-50 dark:bg-red-100' 
                    : ''
                }`}
                placeholder="50000"
                step="100"
                min="0"
              />
              {errors.availableBalance && <p className="mt-1 text-sm text-black font-bold">{errors.availableBalance}</p>}
            </div>

            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
                <Brain size={16} className="inline mr-2" />
                Preferences (Optional)
              </label>
              <textarea
                name="preferences"
                value={formData.preferences}
                onChange={handleChange}
                className="w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide focus-ring text-sm resize-none"
                placeholder="e.g., Focus more on groceries, less on entertainment, prioritize savings..."
                rows={3}
              />
              <p className="mt-1 text-xs text-black font-bold">
                Tell AI about your spending priorities and preferences
              </p>
            </div>
          </div>

          {!showSuggestions ? (
            <div className="flex space-x-3">
              <button
                type="button"
                className="flex-1 px-4 py-2 bg-purple-500 text-white font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                onClick={handleGetSuggestions}
                disabled={loading}
              >
                {loading ? (
                  <div className="w-4 h-4 bg-purple-500 brutal-border brutal-shadow animate-brutal-pulse"></div>
                ) : (
                  <>
                    <Brain size={16} />
                    <span>Get AI Suggestions</span>
                  </>
                )}
              </button>
              <button
                type="button"
                className="flex-1 px-4 py-2 bg-orange-500 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                onClick={handleAutoAllocate}
                disabled={loading}
              >
                {loading ? (
                  <div className="w-4 h-4 bg-orange-500 brutal-border brutal-shadow animate-brutal-pulse"></div>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    <span>Auto Allocate Now</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-black uppercase tracking-wide">AI Suggestions</h3>
                <button
                  className="px-3 py-1 bg-gray-500 text-white font-bold uppercase tracking-wide brutal-button brutal-shadow-hover text-sm"
                  onClick={() => setShowSuggestions(false)}
                >
                  Edit
                </button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 brutal-card bg-orange-50 dark:bg-orange-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-black text-sm uppercase tracking-wide">
                        {suggestion.category}
                      </span>
                      <span className="font-black text-black text-lg">
                        {formatAmount(suggestion.amount)}
                      </span>
                    </div>
                    <p className="text-xs text-black font-bold">
                      {suggestion.reasoning}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  className="flex-1 px-4 py-2 bg-orange-500 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  onClick={handleAutoAllocate}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-4 h-4 bg-orange-500 brutal-border brutal-shadow animate-brutal-pulse"></div>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>Apply These Allocations</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="flex-1 px-4 py-2 bg-white text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAutoBudgetModal;
