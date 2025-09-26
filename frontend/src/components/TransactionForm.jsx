import { useState, useEffect } from 'react';
import { X, Calendar, Tag, DollarSign, Type, Mic, Square } from 'lucide-react';
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
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

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
    <div className="fixed inset-0 bg-transparent flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button 
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
            onClick={onClose}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {errors.submit}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Import from image
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setLoading(true);
                    const res = await transactionAPI.analyzeImage(file);
                    if (res.success) {
                      const data = res.data;
                      setFormData((prev) => ({
                        ...prev,
                        title: data.record_title || prev.title,
                        amount: data.record_amount != null ? String(data.record_amount) : prev.amount,
                        category: data.record_category || prev.category,
                        type: data.record_flow || prev.type,
                        description: data.record_description || prev.description
                      }));
                      // Refresh categories if type changed
                      if (data.record_flow && data.record_flow !== formData.type) {
                        await loadCategories();
                      }
                    } else {
                      console.error(res.message || 'Failed to analyze image');
                      alert(res.message || 'Failed to analyze image');
                    }
                  } catch (err) {
                    console.error(err);
                    alert(err.response?.data?.message || 'Image analysis failed');
                  } finally {
                    setLoading(false);
                    e.target.value = '';
                  }
                }}
                className="block w-full text-sm text-gray-900 dark:text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300 hover:file:bg-gray-200 dark:hover:file:bg-gray-600"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Upload a transaction receipt image to auto-fill fields.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Or, speak your transaction
            </label>
            <div className="flex items-center gap-3">
              {!recording ? (
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-2"
                  onClick={async () => {
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                      const mr = new MediaRecorder(stream);
                      const chunks = [];
                      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
                      mr.onstop = async () => {
                        const blob = new Blob(chunks, { type: 'audio/webm' });
                        try {
                          setLoading(true);
                          const res = await transactionAPI.analyzeAudio(blob);
                          if (res.success) {
                            const data = res.data;
                            setFormData((prev) => ({
                              ...prev,
                              title: data.record_title || prev.title,
                              amount: data.record_amount != null ? String(data.record_amount) : prev.amount,
                              category: data.record_category || prev.category,
                              type: data.record_flow || prev.type,
                              description: data.record_description || prev.description
                            }));
                            if (data.record_flow && data.record_flow !== formData.type) {
                              await loadCategories();
                            }
                          } else {
                            alert(res.message || 'Failed to analyze audio');
                          }
                        } catch (err) {
                          console.error(err);
                          alert(err.response?.data?.message || 'Audio analysis failed');
                        } finally {
                          setLoading(false);
                        }
                      };
                      mr.start();
                      setMediaRecorder(mr);
                      setRecording(true);
                    } catch (err) {
                      console.error(err);
                      alert('Microphone permission is required to record audio');
                    }
                  }}
                >
                  <Mic size={16} /> Start speaking
                </button>
              ) : (
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 inline-flex items-center gap-2"
                  onClick={() => {
                    try { mediaRecorder && mediaRecorder.stop(); } catch {}
                    setRecording(false);
                  }}
                >
                  <Square size={16} /> Stop
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Say something like: “Expense, Groceries, ₹550, dinner at cafe, today”.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Type size={16} className="inline mr-2" />
              Transaction Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`p-3 rounded-lg border-2 font-medium transition-all ${
                  formData.type === 'expense' 
                    ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-500' 
                    : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
                onClick={() => handleChange({ target: { name: 'type', value: 'expense' } })}
              >
                Expense
              </button>
              <button
                type="button"
                className={`p-3 rounded-lg border-2 font-medium transition-all ${
                  formData.type === 'income' 
                    ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-500' 
                    : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
                onClick={() => handleChange({ target: { name: 'type', value: 'income' } })}
              >
                Income
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Type size={16} className="inline mr-2" />
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.title 
                  ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
              placeholder="Enter transaction title"
              maxLength={100}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <DollarSign size={16} className="inline mr-2" />
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
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.amount 
                  ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
              placeholder="0.00"
            />
            {errors.amount && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Tag size={16} className="inline mr-2" />
              Category *
            </label>
            <div className="flex gap-2">
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.category 
                  ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              <option value="">Select category</option>
              {categories.map(category => (
                <option key={category._id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            </div>
            {errors.category && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category}</p>}
          </div>

          

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar size={16} className="inline mr-2" />
              Date *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              max={new Date().toLocaleDateString('en-CA')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              placeholder="Optional description"
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>{transaction ? 'Update' : 'Add Transaction'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
      {/* Removed inline Add Category modal to keep transactions focused */}
    </div>
  );
};

export default TransactionForm;
