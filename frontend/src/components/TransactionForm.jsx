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
      <div className="brutal-card w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--white)' }}>
        <div className="flex items-center justify-between p-4 brutal-border-b-3">
          <h2 className="text-lg font-black text-black uppercase tracking-wider">
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
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
              Import from image
            </label>
            <div className="flex items-center gap-3">
              <label className="px-3 py-2 bg-orange-500 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce cursor-pointer text-sm">
                Choose File
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
                  className="hidden"
                />
              </label>
              <span className="text-sm text-black font-bold">No file chosen</span>
            </div>
            <p className="mt-1 text-xs text-black font-bold">Upload a transaction receipt image to auto-fill fields.</p>
          </div>

          <div>
            <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
              Or, speak your transaction
            </label>
            <div className="flex items-center gap-3">
              {!recording ? (
                <button
                  type="button"
                  className="px-3 py-2 bg-red-500 text-white font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce inline-flex items-center gap-2 text-sm"
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
                  <Mic size={14} /> Start speaking
                </button>
              ) : (
                <button
                  type="button"
                  className="px-3 py-2 bg-gray-400 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce inline-flex items-center gap-2 text-sm"
                  onClick={() => {
                    try { mediaRecorder && mediaRecorder.stop(); } catch {}
                    setRecording(false);
                  }}
                >
                  <Square size={14} /> Stop
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-black font-bold">Say something like: "Expense, Groceries, ₹550, dinner at cafe, today".</p>
          </div>

          <div>
            <label className="block text-sm font-black text-black mb-3 uppercase tracking-wide">
              <Type size={16} className="inline mr-2" />
              Transaction Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`p-3 font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce text-sm ${
                  formData.type === 'expense' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white text-black'
                }`}
                onClick={() => handleChange({ target: { name: 'type', value: 'expense' } })}
              >
                Expense
              </button>
              <button
                type="button"
                className={`p-3 font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce text-sm ${
                  formData.type === 'income' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white text-black'
                }`}
                onClick={() => handleChange({ target: { name: 'type', value: 'income' } })}
              >
                Income
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
              <Type size={16} className="inline mr-2" />
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide focus-ring text-sm ${
                errors.title 
                  ? 'bg-red-50 dark:bg-red-100' 
                  : ''
              }`}
              placeholder="ENTER TRANSACTION TITLE"
              maxLength={100}
            />
            {errors.title && <p className="mt-1 text-sm text-black font-bold">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
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
              className={`w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide focus-ring text-sm ${
                errors.amount 
                  ? 'bg-red-50 dark:bg-red-100' 
                  : ''
              }`}
              placeholder="0.00"
            />
            {errors.amount && <p className="mt-1 text-sm text-black font-bold">{errors.amount}</p>}
          </div>

          <div>
            <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
              <Tag size={16} className="inline mr-2" />
              Category *
            </label>
            <div className="flex gap-2">
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide focus-ring text-sm ${
                errors.category 
                  ? 'bg-red-50 dark:bg-red-100' 
                  : ''
              }`}
            >
              <option value="">SELECT CATEGORY</option>
              {categories.map(category => (
                <option key={category._id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            </div>
            {errors.category && <p className="mt-1 text-sm text-black font-bold">{errors.category}</p>}
          </div>

          

          <div>
            <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
              <Calendar size={16} className="inline mr-2" />
              Date *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide focus-ring appearance-none [color-scheme:light] dark:[color-scheme:dark] text-sm"
              max={new Date().toLocaleDateString('en-CA')}
            />
          </div>

          <div>
            <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide focus-ring resize-none text-sm"
              placeholder="OPTIONAL DESCRIPTION"
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="flex space-x-3 pt-4">
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
