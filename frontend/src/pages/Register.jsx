import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FormInput from '../components/FormInput';
import { UserPlus, Mail, Lock, User } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">
            <UserPlus size={32} />
          </div>
          <h1>Create Account</h1>
          <p>Join us today</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {authError && (
            <div className="error-banner">
              {authError}
            </div>
          )}

          <FormInput
            label="Full Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="Enter your full name"
            required
          />

          <FormInput
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="Enter your email"
            required
          />

          <FormInput
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="Create a password"
            required
          />

          <FormInput
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            placeholder="Confirm your password"
            required
          />

          <div className="form-options">
            <label className="checkbox-label">
              <input type="checkbox" required />
              <span className="checkmark"></span>
              I agree to the{' '}
              <Link to="/terms" className="terms-link">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="terms-link">
                Privacy Policy
              </Link>
            </label>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="spinner"></div>
            ) : (
              <>
                <UserPlus size={20} />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
