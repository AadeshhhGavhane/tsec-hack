import { Menu, Bell, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { alertsAPI } from '../services/api';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';

const Header = ({ onMenuClick }) => {
  const { user } = useAuth();
  const [openAlerts, setOpenAlerts] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  const loadAlerts = async () => {
    try {
      setLoadingAlerts(true);
      const month = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`;
      const res = await alertsAPI.getAlerts(month);
      if (res.success) setAlerts(res.data.alerts||[]);
    } finally { setLoadingAlerts(false); }
  };
  const location = useLocation();
  const hideGlobalSearch = location.pathname.startsWith('/dashboard/categories');

  return (
    <>
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
          
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors" aria-label="Notifications" onClick={()=>{ setOpenAlerts(v=>!v); if (!openAlerts) loadAlerts(); }}>
            <Bell size={20} />
            {alerts.length>0 && (<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 min-w-5 px-1 flex items-center justify-center">{alerts.length}</span>)}
          </button>
          <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 select-none">
            {user?.name}
          </span>
        </div>
      </div>
    </header>
    {openAlerts && (
      <div className="absolute right-4 top-16 z-40 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-gray-900 dark:text-white">Alerts</div>
          <button className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded" onClick={()=>setOpenAlerts(false)}>Close</button>
        </div>
        {loadingAlerts ? (
          <div className="text-sm text-gray-600 dark:text-gray-400 p-2">Loading...</div>
        ) : alerts.length===0 ? (
          <div className="text-sm text-gray-600 dark:text-gray-400 p-2">No alerts</div>
        ) : (
          <ul className="space-y-2 max-h-80 overflow-auto">
            {alerts.map((a)=> (
              <li key={a.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm font-medium text-gray-900 dark:text-white">{a.title}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{a.message}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    )}
    </>
  );
};

export default Header;
