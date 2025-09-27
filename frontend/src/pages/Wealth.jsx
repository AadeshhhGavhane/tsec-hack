import { useState, useEffect } from 'react';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Building2, 
  CreditCard, 
  PiggyBank, 
  Car, 
  Home,
  Trash2,
  Edit3,
  Calendar,
  BarChart3
} from 'lucide-react';
import { netWorthAPI } from '../services/api';
import FloatingActionButton from '../components/FloatingActionButton';

const Wealth = () => {
  const [loading, setLoading] = useState(true);
  const [currentNetWorth, setCurrentNetWorth] = useState(null);
  const [trend, setTrend] = useState([]);
  const [stats, setStats] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    assets: [{ name: '', type: 'cash', value: '', description: '' }],
    liabilities: [{ name: '', type: 'credit_card', value: '', interestRate: '', minimumPayment: '', description: '' }]
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadNetWorthData();
  }, []);

  const loadNetWorthData = async () => {
    try {
      setLoading(true);
      const [currentResponse, trendResponse, statsResponse] = await Promise.all([
        netWorthAPI.getCurrent(),
        netWorthAPI.getTrend(12),
        netWorthAPI.getStats()
      ]);

      if (currentResponse.success) {
        setCurrentNetWorth(currentResponse.data.netWorth);
      }

      if (trendResponse.success) {
        setTrend(trendResponse.data.trend);
      }

      if (statsResponse.success) {
        setStats(statsResponse.data.stats);
      }
    } catch (error) {
      console.error('Error loading net worth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (type, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addItem = (type) => {
    const newItem = type === 'assets' 
      ? { name: '', type: 'cash', value: '', description: '' }
      : { name: '', type: 'credit_card', value: '', interestRate: '', minimumPayment: '', description: '' };
    
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], newItem]
    }));
  };

  const removeItem = (type, index) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate assets
    formData.assets.forEach((asset, index) => {
      if (!asset.name.trim()) {
        newErrors[`asset_${index}_name`] = 'Asset name is required';
      }
      if (!asset.value || parseFloat(asset.value) < 0) {
        newErrors[`asset_${index}_value`] = 'Asset value must be 0 or greater';
      }
    });

    // Validate liabilities
    formData.liabilities.forEach((liability, index) => {
      if (!liability.name.trim()) {
        newErrors[`liability_${index}_name`] = 'Liability name is required';
      }
      if (!liability.value || parseFloat(liability.value) < 0) {
        newErrors[`liability_${index}_value`] = 'Liability value must be 0 or greater';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    
    try {
      const assets = formData.assets
        .filter(asset => asset.name.trim())
        .map(asset => ({
          ...asset,
          value: parseFloat(asset.value) || 0
        }));

      const liabilities = formData.liabilities
        .filter(liability => liability.name.trim())
        .map(liability => ({
          ...liability,
          value: parseFloat(liability.value) || 0,
          interestRate: parseFloat(liability.interestRate) || 0,
          minimumPayment: parseFloat(liability.minimumPayment) || 0
        }));

      const response = await netWorthAPI.createSnapshot(assets, liabilities);
      
      if (response.success) {
        await loadNetWorthData();
        resetForm();
      } else {
        setErrors({ submit: response.message || 'Failed to create snapshot' });
      }
    } catch (error) {
      console.error('Snapshot error:', error);
      setErrors({ submit: 'Failed to create snapshot' });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      assets: [{ name: '', type: 'cash', value: '', description: '' }],
      liabilities: [{ name: '', type: 'credit_card', value: '', interestRate: '', minimumPayment: '', description: '' }]
    });
    setShowForm(false);
    setErrors({});
  };

  const formatAmount = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);

  const getAssetIcon = (type) => {
    switch (type) {
      case 'cash': return <DollarSign size={20} />;
      case 'savings': return <PiggyBank size={20} />;
      case 'investment': return <TrendingUp size={20} />;
      case 'property': return <Home size={20} />;
      case 'vehicle': return <Car size={20} />;
      default: return <Building2 size={20} />;
    }
  };

  const getLiabilityIcon = (type) => {
    switch (type) {
      case 'credit_card': return <CreditCard size={20} />;
      case 'loan': return <Building2 size={20} />;
      case 'mortgage': return <Home size={20} />;
      case 'student_loan': return <Building2 size={20} />;
      case 'personal_loan': return <Building2 size={20} />;
      default: return <CreditCard size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <div className="w-16 h-16 bg-orange-500 brutal-border brutal-shadow animate-brutal-pulse"></div>
        <p className="text-black font-black text-xl uppercase tracking-wide">Loading wealth data...</p>
      </div>
    );
  }

  return (
    <div className="h-full p-4 space-y-6 overflow-y-auto" style={{ backgroundColor: 'var(--gray-light)' }}>
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-black text-black mb-3 uppercase tracking-wider">Wealth</h1>
        <p className="text-black font-bold text-lg">Track your net worth and build wealth over time.</p>
      </div>

      {/* Net Worth Overview */}
      {currentNetWorth ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="brutal-card p-4 bg-green-50 dark:bg-green-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 brutal-border brutal-shadow flex items-center justify-center">
                <TrendingUp size={24} className="text-black font-bold" />
              </div>
              <div>
                <div className="text-sm font-black text-black uppercase tracking-wide">Net Worth</div>
                <div className={`text-xl font-black ${currentNetWorth.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatAmount(currentNetWorth.netWorth)}
                </div>
              </div>
            </div>
          </div>
          
          <div className="brutal-card p-4 bg-blue-50 dark:bg-blue-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 brutal-border brutal-shadow flex items-center justify-center">
                <Building2 size={24} className="text-black font-bold" />
              </div>
              <div>
                <div className="text-sm font-black text-black uppercase tracking-wide">Total Assets</div>
                <div className="text-xl font-black text-black">{formatAmount(currentNetWorth.totalAssets)}</div>
              </div>
            </div>
          </div>
          
          <div className="brutal-card p-4 bg-red-50 dark:bg-red-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500 brutal-border brutal-shadow flex items-center justify-center">
                <TrendingDown size={24} className="text-black font-bold" />
              </div>
              <div>
                <div className="text-sm font-black text-black uppercase tracking-wide">Total Liabilities</div>
                <div className="text-xl font-black text-black">{formatAmount(currentNetWorth.totalLiabilities)}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="brutal-card p-8 text-center">
          <div className="w-24 h-24 bg-orange-100 brutal-border brutal-shadow flex items-center justify-center mx-auto mb-4">
            <BarChart3 size={40} className="text-orange-500" />
          </div>
          <h3 className="text-xl font-black text-black mb-2 uppercase tracking-wide">No Net Worth Data</h3>
          <p className="text-black font-bold mb-4">Create your first net worth snapshot to get started!</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-orange-500 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce"
          >
            Create Snapshot
          </button>
        </div>
      )}

      {/* Net Worth Trend Chart */}
      {trend.length > 0 && (
        <div className="brutal-card p-4">
          <div className="text-lg font-black text-black mb-4 uppercase tracking-wide">Net Worth Trend (12 Months)</div>
          <div className="grid grid-cols-12 gap-2">
            {trend.map((point, index) => {
              const minValue = Math.min(...trend.map(t => t.netWorth));
              const maxValue = Math.max(...trend.map(t => t.netWorth));
              const range = maxValue - minValue;
              const heightPercentage = range > 0 ? Math.min(100, Math.max(0, ((point.netWorth - minValue) / range) * 100)) : 50;
              
              return (
                <div key={index} className="flex flex-col items-center">
                  <div className="h-24 w-6 bg-gray-100 dark:bg-gray-700 rounded flex items-end overflow-hidden">
                    <div 
                      style={{ 
                        height: `${heightPercentage}%` 
                      }} 
                      className={`w-full ${point.netWorth >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    ></div>
                  </div>
                  <div className="text-xs text-black font-bold mt-1">
                    {new Date(point.date).toLocaleDateString('en-IN', { month: 'short' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Assets and Liabilities */}
      {currentNetWorth && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assets */}
          <div className="brutal-card p-4">
            <div className="text-lg font-black text-black mb-4 uppercase tracking-wide">Assets</div>
            <div className="space-y-3">
              {currentNetWorth.assets.map((asset, index) => (
                <div key={index} className="flex items-center justify-between p-3 brutal-card bg-green-50 dark:bg-green-100">
                  <div className="flex items-center gap-3">
                    <div className="text-green-600">{getAssetIcon(asset.type)}</div>
                    <div>
                      <div className="font-black text-black text-sm uppercase tracking-wide">{asset.name}</div>
                      <div className="text-xs text-black font-bold capitalize">{asset.type.replace('_', ' ')}</div>
                    </div>
                  </div>
                  <div className="text-black font-black">{formatAmount(asset.value)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Liabilities */}
          <div className="brutal-card p-4">
            <div className="text-lg font-black text-black mb-4 uppercase tracking-wide">Liabilities</div>
            <div className="space-y-3">
              {currentNetWorth.liabilities.map((liability, index) => (
                <div key={index} className="flex items-center justify-between p-3 brutal-card bg-red-50 dark:bg-red-100">
                  <div className="flex items-center gap-3">
                    <div className="text-red-600">{getLiabilityIcon(liability.type)}</div>
                    <div>
                      <div className="font-black text-black text-sm uppercase tracking-wide">{liability.name}</div>
                      <div className="text-xs text-black font-bold capitalize">{liability.type.replace('_', ' ')}</div>
                    </div>
                  </div>
                  <div className="text-black font-black">{formatAmount(liability.value)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Net Worth Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="brutal-card w-full max-w-4xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--white)' }}>
            <div className="flex items-center justify-between p-4 brutal-border-b-3">
              <h2 className="text-lg font-black text-black uppercase tracking-wider">Create Net Worth Snapshot</h2>
              <button 
                className="p-2 brutal-button brutal-shadow-hover animate-brutal-bounce"
                onClick={resetForm}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-6">
              {errors.submit && (
                <div className="bg-red-50 dark:bg-red-100 brutal-card px-3 py-2 text-sm font-bold text-black">
                  {errors.submit}
                </div>
              )}

              {/* Assets Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-black uppercase tracking-wide">Assets</h3>
                  <button
                    type="button"
                    onClick={() => addItem('assets')}
                    className="px-3 py-1 bg-green-500 text-white font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce text-sm"
                  >
                    <Plus size={16} className="inline mr-1" />
                    Add Asset
                  </button>
                </div>
                
                <div className="space-y-4">
                  {formData.assets.map((asset, index) => (
                    <div key={index} className="brutal-card p-4 bg-green-50 dark:bg-green-100">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">Name</label>
                          <input
                            type="text"
                            value={asset.name}
                            onChange={(e) => handleInputChange('assets', index, 'name', e.target.value)}
                            className={`w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide text-sm ${
                              errors[`asset_${index}_name`] ? 'bg-red-50 dark:bg-red-100' : ''
                            }`}
                            placeholder="e.g., Savings Account"
                          />
                          {errors[`asset_${index}_name`] && <p className="mt-1 text-xs text-red-600 font-bold">{errors[`asset_${index}_name`]}</p>}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">Type</label>
                          <select
                            value={asset.type}
                            onChange={(e) => handleInputChange('assets', index, 'type', e.target.value)}
                            className="w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide text-sm"
                          >
                            <option value="cash">Cash</option>
                            <option value="savings">Savings</option>
                            <option value="investment">Investment</option>
                            <option value="property">Property</option>
                            <option value="vehicle">Vehicle</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">Value (₹)</label>
                          <input
                            type="number"
                            value={asset.value}
                            onChange={(e) => handleInputChange('assets', index, 'value', e.target.value)}
                            className={`w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide text-sm ${
                              errors[`asset_${index}_value`] ? 'bg-red-50 dark:bg-red-100' : ''
                            }`}
                            placeholder="0"
                            min="0"
                            step="1000"
                          />
                          {errors[`asset_${index}_value`] && <p className="mt-1 text-xs text-red-600 font-bold">{errors[`asset_${index}_value`]}</p>}
                        </div>
                        
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeItem('assets', index)}
                            className="w-full px-3 py-2 bg-red-500 text-white font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce text-sm"
                          >
                            <Trash2 size={16} className="inline mr-1" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Liabilities Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-black uppercase tracking-wide">Liabilities</h3>
                  <button
                    type="button"
                    onClick={() => addItem('liabilities')}
                    className="px-3 py-1 bg-red-500 text-white font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce text-sm"
                  >
                    <Plus size={16} className="inline mr-1" />
                    Add Liability
                  </button>
                </div>
                
                <div className="space-y-4">
                  {formData.liabilities.map((liability, index) => (
                    <div key={index} className="brutal-card p-4 bg-red-50 dark:bg-red-100">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                          <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">Name</label>
                          <input
                            type="text"
                            value={liability.name}
                            onChange={(e) => handleInputChange('liabilities', index, 'name', e.target.value)}
                            className={`w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide text-sm ${
                              errors[`liability_${index}_name`] ? 'bg-red-50 dark:bg-red-100' : ''
                            }`}
                            placeholder="e.g., Credit Card"
                          />
                          {errors[`liability_${index}_name`] && <p className="mt-1 text-xs text-red-600 font-bold">{errors[`liability_${index}_name`]}</p>}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">Type</label>
                          <select
                            value={liability.type}
                            onChange={(e) => handleInputChange('liabilities', index, 'type', e.target.value)}
                            className="w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide text-sm"
                          >
                            <option value="credit_card">Credit Card</option>
                            <option value="loan">Loan</option>
                            <option value="mortgage">Mortgage</option>
                            <option value="student_loan">Student Loan</option>
                            <option value="personal_loan">Personal Loan</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">Value (₹)</label>
                          <input
                            type="number"
                            value={liability.value}
                            onChange={(e) => handleInputChange('liabilities', index, 'value', e.target.value)}
                            className={`w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide text-sm ${
                              errors[`liability_${index}_value`] ? 'bg-red-50 dark:bg-red-100' : ''
                            }`}
                            placeholder="0"
                            min="0"
                            step="1000"
                          />
                          {errors[`liability_${index}_value`] && <p className="mt-1 text-xs text-red-600 font-bold">{errors[`liability_${index}_value`]}</p>}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">Interest Rate (%)</label>
                          <input
                            type="number"
                            value={liability.interestRate}
                            onChange={(e) => handleInputChange('liabilities', index, 'interestRate', e.target.value)}
                            className="w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide text-sm"
                            placeholder="0"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                        </div>
                        
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeItem('liabilities', index)}
                            className="w-full px-3 py-2 bg-red-500 text-white font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce text-sm"
                          >
                            <Trash2 size={16} className="inline mr-1" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  className="flex-1 px-3 py-2 bg-white text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-3 py-2 bg-orange-500 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <div className="w-4 h-4 bg-orange-500 brutal-border brutal-shadow animate-brutal-pulse"></div>
                  ) : (
                    <span>Create Snapshot</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <FloatingActionButton 
        onClick={() => setShowForm(true)}
        label="Add Snapshot"
      />
    </div>
  );
};

export default Wealth;
