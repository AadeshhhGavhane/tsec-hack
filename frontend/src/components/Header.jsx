import { useState } from 'react';
import { Menu, Bell, User, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="header">
      <div className="header-left">
        <button 
          className="menu-button"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        
        <div className="search-container">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="search-input"
          />
        </div>
      </div>

      <div className="header-right">
        <button className="notification-button" aria-label="Notifications">
          <Bell size={20} />
          <span className="notification-badge">3</span>
        </button>

        <div className="user-menu">
          <button 
            className="user-button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-label="User menu"
          >
            <div className="user-avatar">
              <User size={20} />
            </div>
            <span className="user-name">{user?.name}</span>
          </button>

          {showUserMenu && (
            <div className="user-dropdown">
              <div className="user-info">
                <div className="user-avatar-large">
                  <User size={24} />
                </div>
                <div className="user-details">
                  <div className="user-name-large">{user?.name}</div>
                  <div className="user-email">{user?.email}</div>
                </div>
              </div>
              
              <div className="dropdown-divider"></div>
              
              <button className="dropdown-item">
                <User size={16} />
                Profile
              </button>
              <button className="dropdown-item">
                <Bell size={16} />
                Notifications
              </button>
              <button className="dropdown-item">
                Settings
              </button>
              
              <div className="dropdown-divider"></div>
              
              <button 
                className="dropdown-item logout"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
