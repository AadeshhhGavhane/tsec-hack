import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="layout">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      
      <div className="main-content">
        <Header onMenuClick={toggleSidebar} />
        
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
