import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  BarChart3,
  FileText,
  Users,
  CreditCard
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
    { path: '/dashboard/profile', icon: User, label: 'Profile' },
    { path: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/dashboard/reports', icon: FileText, label: 'Reports' },
    { path: '/dashboard/users', icon: Users, label: 'Users' },
    { path: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
    { path: '/dashboard/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <LayoutDashboard size={24} />
            <span>TSEC Hack</span>
          </div>
          <button 
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path} className="nav-item">
                  <Link
                    to={item.path}
                    className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
