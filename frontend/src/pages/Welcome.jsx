import { Link } from 'react-router-dom';
import { LayoutDashboard, CreditCard, Tag, FileText, BookOpen, User } from 'lucide-react';

const Welcome = () => {
  const quickActions = [
    { path: '/dashboard/transactions', icon: CreditCard, label: 'Transactions', description: 'View and manage your transactions' },
    { path: '/dashboard/categories', icon: Tag, label: 'Categories', description: 'Organize your spending categories' },
    { path: '/dashboard/bank-statements', icon: FileText, label: 'Bank Statements', description: 'Upload and analyze bank statements' },
    { path: '/dashboard/learn', icon: BookOpen, label: 'Learn', description: 'Take financial quizzes and learn' },
    { path: '/dashboard/profile', icon: User, label: 'Profile', description: 'Manage your account settings' },
  ];

  return (
    <div className="h-full p-4 space-y-6 overflow-y-auto" style={{ backgroundColor: 'var(--gray-light)' }}>
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-orange-500 brutal-border brutal-shadow flex items-center justify-center mx-auto mb-4">
          <LayoutDashboard size={40} className="text-black font-bold" />
        </div>
        <h1 className="text-4xl font-black text-black mb-3 uppercase tracking-wider">Welcome to FinAI</h1>
        <p className="text-black font-bold text-lg">Your AI-powered financial management platform</p>
      </div>

      <div className="brutal-card p-6">
        <h2 className="text-2xl font-black text-black mb-4 uppercase tracking-wider text-center">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.path}
                to={action.path}
                className="p-4 brutal-card bg-orange-50 dark:bg-orange-100 brutal-shadow-hover transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-orange-500 brutal-border brutal-shadow flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                    <Icon size={24} className="text-black font-bold" />
                  </div>
                  <div>
                    <h3 className="font-black text-black text-lg uppercase tracking-wide">{action.label}</h3>
                    <p className="text-black font-bold text-sm">{action.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="brutal-card p-6">
        <h2 className="text-2xl font-black text-black mb-4 uppercase tracking-wider text-center">Getting Started</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-orange-500 brutal-border brutal-shadow flex items-center justify-center flex-shrink-0">
              <span className="text-black font-black text-sm">1</span>
            </div>
            <div>
              <h3 className="font-black text-black text-lg uppercase tracking-wide">Add Transactions</h3>
              <p className="text-black font-bold text-sm">Start by adding your first transaction or upload a bank statement for AI analysis.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-orange-500 brutal-border brutal-shadow flex items-center justify-center flex-shrink-0">
              <span className="text-black font-black text-sm">2</span>
            </div>
            <div>
              <h3 className="font-black text-black text-lg uppercase tracking-wide">Set Up Categories</h3>
              <p className="text-black font-bold text-sm">Create custom categories to organize your income and expenses.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-orange-500 brutal-border brutal-shadow flex items-center justify-center flex-shrink-0">
              <span className="text-black font-black text-sm">3</span>
            </div>
            <div>
              <h3 className="font-black text-black text-lg uppercase tracking-wide">Learn & Improve</h3>
              <p className="text-black font-bold text-sm">Take financial quizzes to improve your money management skills.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
