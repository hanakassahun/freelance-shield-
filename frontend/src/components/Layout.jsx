import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/projects', label: 'Projects', icon: '📁' },
    { path: '/time-tracking', label: 'Time Tracking', icon: '⏱️' },
    { path: '/invoices', label: 'Invoices', icon: '💰' },
    { path: '/recurring-invoices', label: 'Recurring', icon: '🔄' },
    { path: '/expenses', label: 'Expenses', icon: '💳' },
    { path: '/analytics', label: 'Analytics', icon: '📊' },
    { path: '/clients', label: 'Client Risk', icon: '🛡️' },
    { path: '/communications', label: 'Communications', icon: '💬' },
    { path: '/documents', label: 'Documents', icon: '📄' },
    { path: '/contracts', label: 'Contracts', icon: '📝' },
    { path: '/onboarding', label: 'Onboarding', icon: '✅' },
    { path: '/red-flags', label: 'Red Flags', icon: '🚩' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                🛡️ Freelance Shield
              </h1>
              <span className="ml-3 text-sm text-gray-500">
                A risk-aware toolkit for freelancers
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

