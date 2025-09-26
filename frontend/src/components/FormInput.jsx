import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const FormInput = ({ 
  label, 
  type = 'text', 
  name, 
  value, 
  onChange, 
  error, 
  placeholder,
  required = false 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      <div className="input-wrapper">
        <input
          type={inputType}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`form-input ${error ? 'error' : ''}`}
          required={required}
        />
        {isPassword && (
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default FormInput;
