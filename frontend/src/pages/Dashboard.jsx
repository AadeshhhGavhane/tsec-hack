import { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity,
  Calendar,
  Clock,
  BarChart3,
  PieChart
} from 'lucide-react';
import { protectedAPI } from '../services/api';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await protectedAPI.getDashboard();
        if (response.success) {
          setDashboardData(response.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    {
      title: 'Total Users',
      value: '1,234',
      change: '+12%',
      changeType: 'positive',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Revenue',
      value: '$45,678',
      change: '+8%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'green'
    },
    {
      title: 'Growth Rate',
      value: '23.5%',
      change: '+2.1%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'purple'
    },
    {
      title: 'Active Users',
      value: '892',
      change: '-3%',
      changeType: 'negative',
      icon: Activity,
      color: 'orange'
    }
  ];

  const recentActivities = [
    { id: 1, action: 'New user registered', time: '2 minutes ago', type: 'user' },
    { id: 2, action: 'Payment received', time: '5 minutes ago', type: 'payment' },
    { id: 3, action: 'System backup completed', time: '1 hour ago', type: 'system' },
    { id: 4, action: 'Report generated', time: '2 hours ago', type: 'report' },
    { id: 5, action: 'User profile updated', time: '3 hours ago', type: 'user' },
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner-large"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's what's happening with your account.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`stat-card ${stat.color}`}>
              <div className="stat-icon">
                <Icon size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-title">{stat.title}</div>
                <div className={`stat-change ${stat.changeType}`}>
                  {stat.change}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-content">
        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-card">
            <div className="chart-header">
              <h3>Analytics Overview</h3>
              <div className="chart-controls">
                <button className="chart-button active">
                  <BarChart3 size={16} />
                  Bar Chart
                </button>
                <button className="chart-button">
                  <PieChart size={16} />
                  Pie Chart
                </button>
              </div>
            </div>
            <div className="chart-placeholder">
              <BarChart3 size={48} />
              <p>Chart visualization would go here</p>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3>Recent Activity</h3>
              <button className="view-all-button">View All</button>
            </div>
            <div className="activity-list">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon">
                    <Clock size={16} />
                  </div>
                  <div className="activity-content">
                    <div className="activity-action">{activity.action}</div>
                    <div className="activity-time">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            <button className="action-button">
              <Users size={20} />
              <span>Add User</span>
            </button>
            <button className="action-button">
              <Calendar size={20} />
              <span>Schedule Event</span>
            </button>
            <button className="action-button">
              <BarChart3 size={20} />
              <span>Generate Report</span>
            </button>
            <button className="action-button">
              <Activity size={20} />
              <span>View Analytics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
