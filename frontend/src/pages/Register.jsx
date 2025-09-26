import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, error: authError, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear auth error when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

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

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter, one uppercase letter, and one number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const result = await register({
        name: formData.name.trim(),
        email: formData.email,
        password: formData.password,
      });
      
      if (result.success) {
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--gray-light)' }}>
      <div className="w-full max-w-md">
        <div className="brutal-card p-6" style={{ backgroundColor: 'var(--white)' }}>
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-orange-500 brutal-border brutal-shadow flex items-center justify-center mx-auto mb-3">
              <UserPlus size={24} className="text-black font-bold" />
            </div>
            <h1 className="text-xl font-black text-black mb-2 uppercase tracking-wider">Create Account</h1>
            <p className="text-black font-bold text-sm">Join us today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {authError && (
              <div className="bg-red-50 dark:bg-red-100 brutal-card px-3 py-2 text-sm font-bold text-black">
                {authError}
              </div>
            )}

            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
                Full Name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black font-bold" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2 brutal-input font-bold focus-ring text-sm ${
                    errors.name 
                      ? 'bg-red-50 dark:bg-red-100' 
                      : ''
                  }`}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              {errors.name && <p className="mt-1 text-sm text-black font-bold">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black font-bold" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2 brutal-input font-bold focus-ring text-sm ${
                    errors.email 
                      ? 'bg-red-50 dark:bg-red-100' 
                      : ''
                  }`}
                  placeholder="Enter your email"
                  required
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-black font-bold">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black font-bold" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-2 brutal-input font-bold focus-ring text-sm ${
                    errors.password 
                      ? 'bg-red-50 dark:bg-red-100' 
                      : ''
                  }`}
                  placeholder="Create a password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black font-bold"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-black font-bold">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black font-bold" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-2 brutal-input font-bold focus-ring text-sm ${
                    errors.confirmPassword 
                      ? 'bg-red-50 dark:bg-red-100' 
                      : ''
                  }`}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black font-bold"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-black font-bold">{errors.confirmPassword}</p>}
            </div>

            <div className="flex items-start">
              <input 
                type="checkbox" 
                required 
                className="w-4 h-4 text-orange-500 bg-white border-black rounded focus:ring-orange-500 focus:ring-2 mt-1"
              />
              <label className="ml-2 text-sm text-black font-bold">
                I agree to the{' '}
                <Link to="/terms" className="text-black font-bold hover:text-orange-500">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-black font-bold hover:text-orange-500">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-500 text-black font-black uppercase tracking-wide py-2 px-4 brutal-button brutal-shadow-hover animate-brutal-bounce disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 bg-orange-500 brutal-border brutal-shadow animate-brutal-pulse"></div>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-black font-bold text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-black font-bold hover:text-orange-500">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
