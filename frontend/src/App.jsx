import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import Learn from './pages/Learn';
import LearnHistory from './pages/LearnHistory';
import Budget from './pages/Budget';
import Insights from './pages/Insights';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="dashboard/profile" element={<Profile />} />
              <Route path="dashboard/transactions" element={<Transactions />} />
              <Route path="dashboard/categories" element={<Categories />} />
              <Route path="dashboard/learn" element={<Learn />} />
              <Route path="dashboard/learn/history" element={<LearnHistory />} />
              <Route path="dashboard/budget" element={<Budget />} />
              <Route path="dashboard/insights" element={<Insights />} />
              <Route path="dashboard/analytics" element={<div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1><p className="text-gray-600 dark:text-gray-400">Analytics page coming soon...</p></div>} />
              <Route path="dashboard/reports" element={<div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1><p className="text-gray-600 dark:text-gray-400">Reports page coming soon...</p></div>} />
              <Route path="dashboard/users" element={<div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1><p className="text-gray-600 dark:text-gray-400">Users page coming soon...</p></div>} />
              <Route path="dashboard/notifications" element={<div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1><p className="text-gray-600 dark:text-gray-400">Notifications page coming soon...</p></div>} />
              <Route path="dashboard/settings" element={<div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1><p className="text-gray-600 dark:text-gray-400">Settings page coming soon...</p></div>} />
            </Route>
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
