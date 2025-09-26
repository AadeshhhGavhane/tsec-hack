import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  User, 
  LogOut, 
  X,
  CreditCard,
  Tag,
  BookOpen,
  FileText
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };
  
  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/dashboard/transactions', icon: CreditCard, label: 'Transactions' },
    { path: '/dashboard/categories', icon: Tag, label: 'Categories' },
    { path: '/dashboard/bank-statements', icon: FileText, label: 'Bank Statements' },
    { path: '/dashboard/learn', icon: BookOpen, label: 'Learn' },
    { path: '/dashboard/profile', icon: User, label: 'Profile' },
  ];

  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/') {
      return false; // Welcome page is not the same as dashboard
    }
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-transparent z-40 lg:hidden" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-white
        brutal-border brutal-shadow
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:shadow-none
      `}>
        <div className="flex items-center justify-between p-6 brutal-border-b-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-500 brutal-border brutal-shadow flex items-center justify-center">
              <LayoutDashboard size={24} className="text-black font-bold" />
            </div>
                <span className="text-xl font-black text-black uppercase tracking-wider">FinAI</span>
          </div>
          <button 
            className="lg:hidden p-3 brutal-button brutal-shadow-hover animate-brutal-bounce"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center space-x-3 px-4 py-3 text-sm font-bold transition-all duration-200 uppercase tracking-wide
                      ${isActive(item.path) 
                        ? 'brutal-button brutal-shadow-hover bg-orange-500 text-black' 
                        : 'text-black hover:bg-orange-100 dark:hover:bg-orange-200 brutal-shadow-hover'
                      }
                    `}
                    onClick={onClose}
                  >
                    <Icon size={20} className="font-bold" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 brutal-border-t-3">
          <button 
            className="w-full flex items-center space-x-3 px-4 py-3 bg-red-500 text-black font-bold uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-pulse" 
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
