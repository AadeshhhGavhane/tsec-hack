import { Menu, Bell, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';

const Header = ({ onMenuClick }) => {
  const { user } = useAuth();
  const location = useLocation();
  const hideGlobalSearch = location.pathname.startsWith('/dashboard/categories');

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-4 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          
          {!hideGlobalSearch && (
          <div className="relative hidden sm:block">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-10 pr-4 py-2 w-48 sm:w-64 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white dark:placeholder-gray-400"
            />
          </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors" aria-label="Notifications">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>
          </button>
          <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 select-none">
            {user?.name}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
