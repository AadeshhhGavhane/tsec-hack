import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = () => {
    console.log('Current theme before toggle:', theme);
    console.log('HTML classes before toggle:', document.documentElement.className);
    toggleTheme();
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        relative inline-flex h-8 w-14 items-center rounded-full transition-colors
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'}
        ${className}
      `}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <span
        className={`
          inline-block h-6 w-6 transform rounded-full bg-white transition-transform
          ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}
        `}
      >
        <div className="flex h-full w-full items-center justify-center">
          {theme === 'dark' ? (
            <Moon size={14} className="text-blue-600" />
          ) : (
            <Sun size={14} className="text-yellow-500" />
          )}
        </div>
      </span>
    </button>
  );
};

export default ThemeToggle;
