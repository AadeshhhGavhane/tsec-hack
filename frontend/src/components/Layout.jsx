import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Chatbot from './Chatbot';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatbotOpen, setChatbotOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors overflow-hidden">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={closeSidebar} 
      />
      
      <div className="flex-1 flex flex-col transition-all duration-300 min-w-0">
        <Header 
          onMenuClick={toggleSidebar} 
          onChatToggle={() => setChatbotOpen(v => !v)}
        />
        
        <main className="flex-1 overflow-y-auto">
          <div className="h-full">
            <Outlet />
          </div>
        </main>
        <Chatbot open={chatbotOpen} onClose={() => setChatbotOpen(false)} />
      </div>
    </div>
  );
};

export default Layout;
