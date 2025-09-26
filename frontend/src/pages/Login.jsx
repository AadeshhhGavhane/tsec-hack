import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Mail, Lock, Eye, EyeOff, KeySquare } from 'lucide-react';
import { passkeysAPI } from '../services/api';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, error: authError, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

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

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const result = await login(formData);
      
      if (result.success) {
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loginWithPasskey = async () => {
    try {
      // Begin
      const begin = await passkeysAPI.beginAuth(formData.email || undefined);
      if (!begin.success) return alert(begin.message || 'Passkey start failed');
      const options = begin.data.options.publicKey;
      // Fix binary fields for WebAuthn (hackathon: assume already base64url strings)
      const b64urlToBytes = (b64url) => { const pad=(s)=> s + '==='.slice((s.length+3)%4); const b64=pad(String(b64url).replace(/-/g,'+').replace(/_/g,'/')); const bin=atob(b64); const bytes=new Uint8Array(bin.length); for (let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i); return bytes; };
      const cred = await navigator.credentials.get({ publicKey: {
        ...options,
        challenge: b64urlToBytes(options.challenge),
        allowCredentials: (options.allowCredentials||[]).map(c=> ({ ...c, id: b64urlToBytes(String(c.id)) }))
      }});
      const clientDataJSON = btoa(String.fromCharCode(...new Uint8Array(cred.response.clientDataJSON)));
      const authenticatorData = cred.response.authenticatorData ? btoa(String.fromCharCode(...new Uint8Array(cred.response.authenticatorData))) : undefined;
      const signature = cred.response.signature ? btoa(String.fromCharCode(...new Uint8Array(cred.response.signature))) : undefined;
      const userHandle = cred.response.userHandle ? btoa(String.fromCharCode(...new Uint8Array(cred.response.userHandle))) : undefined;
      const finish = await passkeysAPI.finishAuth({ id: cred.id, rawId: cred.id, type: cred.type, response: { clientDataJSON, authenticatorData, signature, userHandle } });
      if (!finish.success) return alert(finish.message || 'Passkey auth failed');
      localStorage.setItem('token', finish.data.token);
      // Optional: fetch user and store to align with AuthProvider expectations
      try {
        const resp = await (await import('../services/api')).authAPI.getMe();
        if (resp?.success && resp?.data?.user) {
          localStorage.setItem('user', JSON.stringify(resp.data.user));
        }
      } catch {}
      // Force reload to let AuthProvider initialize from token
      window.location.assign('/dashboard');
    } catch (e) {
      console.error(e);
      alert('Passkey unsupported or cancelled');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-white brutal-card p-6">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-orange-500 brutal-border brutal-shadow flex items-center justify-center mx-auto mb-3">
              <LogIn size={24} className="text-black font-bold" />
            </div>
            <h1 className="text-xl font-black text-black mb-2 uppercase tracking-wider">Welcome Back</h1>
            <p className="text-black font-bold text-sm">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {authError && (
              <div className="bg-red-50 dark:bg-red-100 brutal-card px-3 py-2 text-sm font-bold text-black">
                {authError}
              </div>
            )}

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
                      : 'bg-white dark:bg-white'
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
                      : 'bg-white dark:bg-white'
                  }`}
                  placeholder="Enter your password"
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

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-orange-500 bg-white border-black rounded focus:ring-orange-500 focus:ring-2" />
                <span className="ml-2 text-sm text-black font-bold">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-black font-bold hover:text-orange-500">
                Forgot password?
              </Link>
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
                  <LogIn size={16} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={loginWithPasskey} className="w-full mb-4 inline-flex items-center justify-center gap-2 px-3 py-2 bg-white text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce text-sm">
              <KeySquare size={16} /> Login with Passkey
            </button>
            <p className="text-black font-bold text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-black font-bold hover:text-orange-500">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
