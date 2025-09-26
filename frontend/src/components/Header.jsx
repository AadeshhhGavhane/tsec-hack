import { Menu, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { alertsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';

const Header = ({ onMenuClick, onChatToggle }) => {
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

  // Load alerts on component mount
  useEffect(() => {
    if (user) {
      loadAlerts();
    }
  }, [user]);

  return (
    <>
        <header className="brutal-border-b-3 px-4 lg:px-6 py-4 sticky top-0 z-30 brutal-shadow" style={{ backgroundColor: 'var(--white)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            className="lg:hidden p-3 brutal-button brutal-shadow-hover animate-brutal-bounce"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          <button className="relative p-3 brutal-button brutal-shadow-hover animate-brutal-bounce" aria-label="Notifications" onClick={()=>{ setOpenAlerts(v=>!v); }}>
            <Bell size={20} />
            {alerts.length>0 && (<span className="absolute -top-1 -right-1 bg-red-500 text-black text-xs font-black h-6 min-w-6 px-1 flex items-center justify-center brutal-border">{alerts.length}</span>)}
          </button>
          <button className="px-6 py-3 bg-orange-500 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-pulse" onClick={onChatToggle}>Chat</button>
          <span className="hidden sm:block text-sm font-black text-black uppercase tracking-wide select-none">
            {user?.name}
          </span>
        </div>
      </div>
    </header>
        {openAlerts && (
          <div className="absolute right-4 top-16 z-40 w-80 brutal-card p-4 animate-brutal-slide" style={{ backgroundColor: 'var(--white)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="font-black text-black uppercase tracking-wide">Alerts</div>
          <button className="text-sm px-3 py-2 bg-red-500 text-black font-bold uppercase tracking-wide brutal-button brutal-shadow-hover" onClick={()=>setOpenAlerts(false)}>Close</button>
        </div>
        {loadingAlerts ? (
          <div className="text-sm text-black font-bold p-3 brutal-card">Loading...</div>
        ) : alerts.length===0 ? (
          <div className="text-sm text-black font-bold p-3 brutal-card">No alerts</div>
        ) : (
          <ul className="space-y-3 max-h-80 overflow-auto">
            {alerts.map((a)=> (
              <li key={a.id} className="p-3 brutal-card">
                <div className="text-sm font-black text-black uppercase">{a.title}</div>
                <div className="text-xs text-black font-bold">{a.message}</div>
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
