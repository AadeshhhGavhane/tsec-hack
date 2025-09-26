import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Transactions from './pages/Transactions';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
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
              <Route path="dashboard/analytics" element={<div className="page-placeholder"><h1>Analytics</h1><p>Analytics page coming soon...</p></div>} />
              <Route path="dashboard/reports" element={<div className="page-placeholder"><h1>Reports</h1><p>Reports page coming soon...</p></div>} />
              <Route path="dashboard/users" element={<div className="page-placeholder"><h1>Users</h1><p>Users page coming soon...</p></div>} />
              <Route path="dashboard/notifications" element={<div className="page-placeholder"><h1>Notifications</h1><p>Notifications page coming soon...</p></div>} />
              <Route path="dashboard/settings" element={<div className="page-placeholder"><h1>Settings</h1><p>Settings page coming soon...</p></div>} />
            </Route>
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
