import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState({
    clients: 0,
    invoices: 0,
    contracts: 0,
    overdueInvoices: 0,
    projects: 0,
    activeProjects: 0,
    totalRevenue: 0,
    highRiskClients: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [dashboardRes, clientsRes, invoicesRes, contractsRes, projectsRes] = await Promise.all([
          axios.get('/api/analytics/dashboard'),
          axios.get('/api/clients'),
          axios.get('/api/invoices'),
          axios.get('/api/contracts'),
          axios.get('/api/projects')
        ]);

        const dashboard = dashboardRes.data;

        setStats({
          clients: dashboard.totalClients,
          invoices: dashboard.totalInvoices,
          contracts: dashboard.totalContracts,
          overdueInvoices: dashboard.overdueInvoices,
          projects: dashboard.totalProjects,
          activeProjects: dashboard.activeProjects,
          totalRevenue: dashboard.totalRevenue,
          highRiskClients: dashboard.highRiskClients
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const quickActions = [
    { path: '/contracts', label: 'Generate Contract', icon: '📄', color: 'bg-blue-500' },
    { path: '/projects', label: 'Projects', icon: '📁', color: 'bg-purple-500' },
    { path: '/time-tracking', label: 'Time Tracking', icon: '⏱️', color: 'bg-indigo-500' },
    { path: '/invoices', label: 'Create Invoice', icon: '💰', color: 'bg-green-500' },
    { path: '/analytics', label: 'Analytics', icon: '📊', color: 'bg-teal-500' },
    { path: '/clients', label: 'Client Risk', icon: '🛡️', color: 'bg-red-500' },
    { path: '/expenses', label: 'Expenses', icon: '💳', color: 'bg-orange-500' },
    { path: '/communications', label: 'Communications', icon: '💬', color: 'bg-cyan-500' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-2 text-gray-600">
          Welcome to Freelance Shield. Manage your contracts, assess client risk, and track invoices.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Clients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.clients}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <span className="text-2xl">📁</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overdueInvoices}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className={`${action.color} text-white rounded-lg p-6 hover:opacity-90 transition-opacity`}
            >
              <div className="text-3xl mb-2">{action.icon}</div>
              <div className="font-semibold">{action.label}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

