import { useState, useEffect } from 'react';
import { Plus, Target, Calendar, DollarSign, TrendingUp, Edit3, Trash2, Brain, Clock, CheckCircle } from 'lucide-react';
import { financialGoalsAPI } from '../services/api';
import FloatingActionButton from '../components/FloatingActionButton';

const FinancialGoals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    targetDate: '',
    priority: 'medium',
    category: 'other',
    // Debt-specific fields
    debtType: 'credit_card',
    interestRate: '',
    minimumPayment: '',
    currentBalance: '',
    payoffStrategy: 'debt_snowball'
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [showDebtPayoff, setShowDebtPayoff] = useState(false);
  const [debtPayoffData, setDebtPayoffData] = useState(null);
  const [monthlyPayment, setMonthlyPayment] = useState('');

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const response = await financialGoalsAPI.getGoals();
      if (response.success) {
        setGoals(response.data.goals || []);
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Goal title is required';
    }

    if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
      newErrors.targetAmount = 'Target amount must be greater than 0';
    }

    if (!formData.targetDate) {
      newErrors.targetDate = 'Target date is required';
    } else if (new Date(formData.targetDate) <= new Date()) {
      newErrors.targetDate = 'Target date must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    
    try {
      const goalData = {
        ...formData,
        targetAmount: parseFloat(formData.targetAmount),
        targetDate: formData.targetDate
      };

      let response;
      if (editingGoal) {
        response = await financialGoalsAPI.updateGoal(editingGoal._id, goalData);
      } else {
        response = await financialGoalsAPI.createGoal(goalData);
      }
      
      if (response.success) {
        await loadGoals();
        resetForm();
      } else {
        setErrors({ submit: response.message || 'Failed to save goal' });
      }
    } catch (error) {
      console.error('Goal error:', error);
      setErrors({ submit: 'Failed to save goal' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      targetAmount: goal.targetAmount.toString(),
      targetDate: goal.targetDate.split('T')[0],
      priority: goal.priority,
      category: goal.category
    });
    setShowForm(true);
  };

  const handleDelete = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    
    try {
      const response = await financialGoalsAPI.deleteGoal(goalId);
      if (response.success) {
        await loadGoals();
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete goal');
    }
  };

  const handleGenerateRoadmap = async (goal) => {
    try {
      setSubmitting(true);
      const response = await financialGoalsAPI.generateRoadmap(goal._id);
      if (response.success) {
        setSelectedGoal(response.data.goal);
        setShowRoadmap(true);
        await loadGoals(); // Reload to get updated roadmap
      }
    } catch (error) {
      console.error('Roadmap error:', error);
      alert('Failed to generate roadmap');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDebtPayoff = async (goal) => {
    try {
      setSubmitting(true);
      const response = await financialGoalsAPI.getDebtPayoff(goal._id, monthlyPayment);
      if (response.success) {
        setSelectedGoal(goal);
        setDebtPayoffData(response.data);
        setShowDebtPayoff(true);
      }
    } catch (error) {
      console.error('Debt payoff error:', error);
      alert('Failed to calculate debt payoff');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDebtPayment = async (goalId, paymentAmount) => {
    try {
      setSubmitting(true);
      const response = await financialGoalsAPI.recordDebtPayment(goalId, paymentAmount);
      if (response.success) {
        await loadGoals();
        alert('Debt payment recorded successfully!');
      }
    } catch (error) {
      console.error('Debt payment error:', error);
      alert('Failed to record debt payment');
    } finally {
      setSubmitting(false);
    }
  };


  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      targetAmount: '',
      targetDate: '',
      priority: 'medium',
      category: 'other',
      debtType: 'credit_card',
      interestRate: '',
      minimumPayment: '',
      currentBalance: '',
      payoffStrategy: 'debt_snowball'
    });
    setEditingGoal(null);
    setShowForm(false);
    setErrors({});
  };

  const formatAmount = (amount) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'emergency_fund': return '🛡️';
      case 'vacation': return '✈️';
      case 'home': return '🏠';
      case 'car': return '🚗';
      case 'education': return '🎓';
      case 'retirement': return '👴';
      case 'debt_payoff': return '💳';
      case 'investment': return '📈';
      default: return '🎯';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <div className="w-16 h-16 bg-orange-500 brutal-border brutal-shadow animate-brutal-pulse"></div>
        <p className="text-black font-black text-xl uppercase tracking-wide">Loading goals...</p>
      </div>
    );
  }

  return (
    <div className="h-full p-4 space-y-6 overflow-y-auto" style={{ backgroundColor: 'var(--gray-light)' }}>
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-black text-black mb-3 uppercase tracking-wider">Financial Goals</h1>
        <p className="text-black font-bold text-lg">Set and track your financial objectives with AI-powered roadmaps.</p>
      </div>


      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="brutal-card p-8 text-center">
          <div className="w-24 h-24 bg-orange-100 brutal-border brutal-shadow flex items-center justify-center mx-auto mb-4">
            <Target size={40} className="text-orange-500" />
          </div>
          <h3 className="text-xl font-black text-black mb-2 uppercase tracking-wide">No Goals Yet</h3>
          <p className="text-black font-bold mb-4">Create your first financial goal to get started!</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-orange-500 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce"
          >
            Create Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {goals.map((goal) => (
            <div key={goal._id} className="brutal-card bg-orange-50 dark:bg-orange-100 p-4 relative">
              {/* Priority Indicator */}
              <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${getPriorityColor(goal.priority)}`}></div>
              
              {/* Category Icon */}
              <div className="text-3xl mb-3">{getCategoryIcon(goal.category)}</div>
              
              {/* Goal Info */}
              <div className="mb-3">
                <h3 className="text-base font-black text-black uppercase tracking-wide mb-2">{goal.title}</h3>
                {goal.description && (
                  <p className="text-xs text-black font-bold mb-2">{goal.description}</p>
                )}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-black">Target:</span>
                    <span className="text-xs font-black text-black">{formatAmount(goal.targetAmount)}</span>
                  </div>
                </div>
              </div>


              {/* Goal Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-black font-bold">
                  <Calendar size={14} />
                  <span>Due: {new Date(goal.targetDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-black font-bold">
                  <Clock size={14} />
                  <span>{goal.timeRemaining} days left</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-black font-bold">
                  <DollarSign size={14} />
                  <span>Monthly: {formatAmount(goal.monthlyContributionNeeded)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(goal)}
                  className="flex-1 px-2 py-1 bg-orange-500 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce text-xs flex items-center justify-center gap-1"
                >
                  <Edit3 size={12} />
                  <span>Edit</span>
                </button>
                {goal.category === 'debt_payoff' ? (
                  <button
                    onClick={() => handleDebtPayoff(goal)}
                    disabled={submitting}
                    className="flex-1 px-2 py-1 bg-blue-500 text-white font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce text-xs flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <TrendingDown size={12} />
                    <span>Payoff</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleGenerateRoadmap(goal)}
                    disabled={submitting}
                    className="flex-1 px-2 py-1 bg-purple-500 text-white font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce text-xs flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <Brain size={12} />
                    <span>AI</span>
                  </button>
                )}
                <button
                  onClick={() => handleDelete(goal._id)}
                  className="flex-1 px-2 py-1 bg-red-500 text-white font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce text-xs flex items-center justify-center gap-1"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Goal Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="brutal-card w-full max-w-md" style={{ backgroundColor: 'var(--white)' }}>
            <div className="flex items-center justify-between p-4 brutal-border-b-3">
              <h2 className="text-lg font-black text-black uppercase tracking-wider">
                {editingGoal ? 'Edit Goal' : 'Add Goal'}
              </h2>
              <button 
                className="p-2 brutal-button brutal-shadow-hover animate-brutal-bounce"
                onClick={resetForm}
              >
                ×
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
                  Goal Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide focus-ring text-sm ${
                    errors.title ? 'bg-red-50 dark:bg-red-100' : ''
                  }`}
                  placeholder="e.g., Emergency Fund"
                />
                {errors.title && <p className="mt-1 text-sm text-black font-bold">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide focus-ring text-sm resize-none"
                  placeholder="Optional description..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
                  Target Amount (₹) *
                </label>
                <input
                  type="number"
                  name="targetAmount"
                  value={formData.targetAmount}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide focus-ring text-sm ${
                    errors.targetAmount ? 'bg-red-50 dark:bg-red-100' : ''
                  }`}
                  placeholder="500000"
                  step="1000"
                  min="0"
                />
                {errors.targetAmount && <p className="mt-1 text-sm text-black font-bold">{errors.targetAmount}</p>}
              </div>

              <div>
                <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
                  Target Date *
                </label>
                <input
                  type="date"
                  name="targetDate"
                  value={formData.targetDate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide focus-ring text-sm ${
                    errors.targetDate ? 'bg-red-50 dark:bg-red-100' : ''
                  }`}
                />
                {errors.targetDate && <p className="mt-1 text-sm text-black font-bold">{errors.targetDate}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide text-sm"
                  >
                    <option value="emergency_fund">Emergency Fund</option>
                    <option value="vacation">Vacation</option>
                    <option value="home">Home</option>
                    <option value="car">Car</option>
                    <option value="education">Education</option>
                    <option value="retirement">Retirement</option>
                    <option value="debt_payoff">Debt Payoff</option>
                    <option value="investment">Investment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Debt-specific fields */}
              {formData.category === 'debt_payoff' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-black text-black uppercase tracking-wide">Debt Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
                        Debt Type
                      </label>
                      <select
                        name="debtType"
                        value={formData.debtType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide text-sm"
                      >
                        <option value="credit_card">Credit Card</option>
                        <option value="personal_loan">Personal Loan</option>
                        <option value="student_loan">Student Loan</option>
                        <option value="mortgage">Mortgage</option>
                        <option value="car_loan">Car Loan</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
                        Interest Rate (%)
                      </label>
                      <input
                        type="number"
                        name="interestRate"
                        value={formData.interestRate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide text-sm"
                        placeholder="0"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
                        Minimum Payment (₹)
                      </label>
                      <input
                        type="number"
                        name="minimumPayment"
                        value={formData.minimumPayment}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide text-sm"
                        placeholder="0"
                        min="0"
                        step="100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
                        Current Balance (₹)
                      </label>
                      <input
                        type="number"
                        name="currentBalance"
                        value={formData.currentBalance}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide text-sm"
                        placeholder="0"
                        min="0"
                        step="100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
                      Payoff Strategy
                    </label>
                    <select
                      name="payoffStrategy"
                      value={formData.payoffStrategy}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide text-sm"
                    >
                      <option value="debt_snowball">Debt Snowball (Smallest First)</option>
                      <option value="debt_avalanche">Debt Avalanche (Highest Interest First)</option>
                      <option value="minimum_payment">Minimum Payment Only</option>
                      <option value="custom">Custom Strategy</option>
                    </select>
                  </div>
                </div>
              )}

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
                    <span>{editingGoal ? 'Update' : 'Create'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Roadmap Modal */}
      {showRoadmap && selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="brutal-card w-full max-w-4xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--white)' }}>
            <div className="flex items-center justify-between p-4 brutal-border-b-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 brutal-border brutal-shadow flex items-center justify-center">
                  <Brain size={20} className="text-white font-bold" />
                </div>
                <h2 className="text-lg font-black text-black uppercase tracking-wider">
                  AI Roadmap: {selectedGoal.title}
                </h2>
              </div>
              <button 
                className="p-2 brutal-button brutal-shadow-hover animate-brutal-bounce"
                onClick={() => setShowRoadmap(false)}
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {selectedGoal.aiRoadmap?.suggested ? (
                <div className="space-y-6">
                  {/* Feasibility Assessment */}
                  <div className="brutal-card p-4 bg-orange-50 dark:bg-orange-100">
                    <h3 className="text-lg font-black text-black mb-3 uppercase tracking-wide">Feasibility Assessment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-black text-black">{formatAmount(selectedGoal.aiRoadmap.monthlyContribution)}</div>
                        <div className="text-sm font-bold text-black">Monthly Contribution</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-black text-black">{selectedGoal.aiRoadmap.timeline?.years || 0}Y {selectedGoal.aiRoadmap.timeline?.months || 0}M</div>
                        <div className="text-sm font-bold text-black">Timeline</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-black text-black">{Math.round(selectedGoal.progressPercentage)}%</div>
                        <div className="text-sm font-bold text-black">Progress</div>
                      </div>
                    </div>
                  </div>

                  {/* Phases */}
                  {selectedGoal.aiRoadmap.suggestions?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-black text-black mb-4 uppercase tracking-wide">Implementation Phases</h3>
                      <div className="space-y-4">
                        {selectedGoal.aiRoadmap.suggestions.map((phase, index) => (
                          <div key={index} className="brutal-card p-4 bg-orange-50 dark:bg-orange-100">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-black text-black uppercase tracking-wide">{phase.phase}</h4>
                              <div className="text-sm font-bold text-black">{phase.duration}</div>
                            </div>
                            <p className="text-black font-bold mb-3">{phase.description}</p>
                            <div className="flex items-center gap-2 mb-3">
                              <DollarSign size={16} className="text-black" />
                              <span className="font-bold text-black">{formatAmount(phase.monthlyAmount)}/month</span>
                            </div>
                            {phase.tips && phase.tips.length > 0 && (
                              <div>
                                <h5 className="font-bold text-black mb-2">Tips:</h5>
                                <ul className="space-y-1">
                                  {phase.tips.map((tip, tipIndex) => (
                                    <li key={tipIndex} className="text-sm text-black font-bold flex items-start gap-2">
                                      <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                                      {tip}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-purple-100 brutal-border brutal-shadow flex items-center justify-center mx-auto mb-4">
                    <Brain size={32} className="text-purple-500" />
                  </div>
                  <h3 className="text-lg font-black text-black mb-2 uppercase tracking-wide">No AI Roadmap Yet</h3>
                  <p className="text-black font-bold mb-4">Generate an AI-powered roadmap for this goal!</p>
                  <button
                    onClick={() => handleGenerateRoadmap(selectedGoal)}
                    className="px-4 py-2 bg-purple-500 text-white font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce"
                  >
                    Generate Roadmap
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Debt Payoff Modal */}
      {showDebtPayoff && selectedGoal && debtPayoffData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="brutal-card w-full max-w-6xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--white)' }}>
            <div className="flex items-center justify-between p-4 brutal-border-b-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 brutal-border brutal-shadow flex items-center justify-center">
                  <TrendingDown size={20} className="text-white font-bold" />
                </div>
                <h2 className="text-lg font-black text-black uppercase tracking-wider">
                  Debt Payoff: {selectedGoal.title}
                </h2>
              </div>
              <button 
                className="p-2 brutal-button brutal-shadow-hover animate-brutal-bounce"
                onClick={() => setShowDebtPayoff(false)}
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {debtPayoffData.payoffCalculation ? (
                <div className="space-y-6">
                  {/* Payoff Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="brutal-card p-4 bg-blue-50 dark:bg-blue-100 text-center">
                      <div className="text-2xl font-black text-black">
                        {debtPayoffData.payoffCalculation.monthsToPayoff || 'N/A'}
                      </div>
                      <div className="text-sm font-bold text-black">Months to Payoff</div>
                    </div>
                    <div className="brutal-card p-4 bg-green-50 dark:bg-green-100 text-center">
                      <div className="text-2xl font-black text-black">
                        {formatAmount(debtPayoffData.payoffCalculation.totalInterest)}
                      </div>
                      <div className="text-sm font-bold text-black">Total Interest</div>
                    </div>
                    <div className="brutal-card p-4 bg-orange-50 dark:bg-orange-100 text-center">
                      <div className="text-2xl font-black text-black">
                        {formatAmount(debtPayoffData.payoffCalculation.totalPayments)}
                      </div>
                      <div className="text-sm font-bold text-black">Total Payments</div>
                    </div>
                    <div className="brutal-card p-4 bg-purple-50 dark:bg-purple-100 text-center">
                      <div className="text-2xl font-black text-black">
                        {formatAmount(debtPayoffData.goal.debtDetails.currentBalance)}
                      </div>
                      <div className="text-sm font-bold text-black">Current Balance</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {debtPayoffData.progress && (
                    <div className="brutal-card p-4">
                      <h3 className="text-lg font-black text-black mb-4 uppercase tracking-wide">Payoff Progress</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-bold text-black">
                          <span>Paid Off: {formatAmount(debtPayoffData.progress.paidOff)}</span>
                          <span>{Math.round(debtPayoffData.progress.progressPercentage)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                          <div 
                            className="bg-green-500 h-4 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(debtPayoffData.progress.progressPercentage, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-black font-bold">
                          <span>Remaining: {formatAmount(debtPayoffData.progress.remainingBalance)}</span>
                          <span>Original: {formatAmount(debtPayoffData.progress.originalBalance)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payoff Timeline Chart */}
                  {debtPayoffData.timeline && debtPayoffData.timeline.length > 0 && (
                    <div className="brutal-card p-4">
                      <h3 className="text-lg font-black text-black mb-4 uppercase tracking-wide">Payoff Timeline (First 24 Months)</h3>
                      <div className="grid grid-cols-12 gap-1">
                        {debtPayoffData.timeline.slice(0, 24).map((month, index) => (
                          <div key={index} className="flex flex-col items-center">
                            <div className="h-16 w-4 bg-gray-100 dark:bg-gray-700 rounded flex items-end overflow-hidden">
                              <div 
                                style={{ 
                                  height: `${Math.min(100, (month.balance / debtPayoffData.goal.debtDetails.currentBalance) * 100)}%` 
                                }} 
                                className="w-full bg-red-500"
                                title={`Month ${month.month}: ₹${Math.round(month.balance)}`}
                              ></div>
                            </div>
                            <div className="text-xs text-black font-bold mt-1">
                              {month.month}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payment Input */}
                  <div className="brutal-card p-4">
                    <h3 className="text-lg font-black text-black mb-4 uppercase tracking-wide">Record Payment</h3>
                    <div className="flex gap-4">
                      <input
                        type="number"
                        placeholder="Payment amount (₹)"
                        className="flex-1 px-3 py-2 brutal-input font-bold uppercase tracking-wide text-sm"
                        id="paymentAmount"
                      />
                      <button
                        onClick={() => {
                          const amount = document.getElementById('paymentAmount').value;
                          if (amount && parseFloat(amount) > 0) {
                            handleDebtPayment(selectedGoal._id, parseFloat(amount));
                            setShowDebtPayoff(false);
                          }
                        }}
                        className="px-4 py-2 bg-green-500 text-white font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce"
                      >
                        Record Payment
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 brutal-border brutal-shadow flex items-center justify-center mx-auto mb-4">
                    <TrendingDown size={32} className="text-blue-500" />
                  </div>
                  <h3 className="text-lg font-black text-black mb-2 uppercase tracking-wide">Unable to Calculate Payoff</h3>
                  <p className="text-black font-bold mb-4">Please check your debt details and try again.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <FloatingActionButton 
        onClick={() => setShowForm(true)}
        label="Add Goal"
      />
    </div>
  );
};

export default FinancialGoals;
