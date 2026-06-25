import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState({
    clients: 0,
    invoices: 0,
    contracts: 0,
    overdueInvoices: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [clientsRes, invoicesRes, contractsRes] = await Promise.all([
          axios.get('/api/clients'),
          axios.get('/api/invoices'),
          axios.get('/api/contracts')
        ]);

        const invoices = invoicesRes.data;
        const overdueInvoices = invoices.filter(inv => {
          const dueDate = new Date(inv.due_date);
          const today = new Date();
          return dueDate < today && inv.status === 'pending';
        });

        setStats({
          clients: clientsRes.data.length,
          invoices: invoices.length,
          contracts: contractsRes.data.length,
          overdueInvoices: overdueInvoices.length
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const quickActions = [
    { path: '/contracts', label: 'Generate Contract', icon: '📄', color: 'bg-blue-500' },
    { path: '/clients', label: 'Assess Client Risk', icon: '🛡️', color: 'bg-red-500' },
    { path: '/invoices', label: 'Create Invoice', icon: '💰', color: 'bg-green-500' },
    { path: '/red-flags', label: 'Check Red Flags', icon: '🚩', color: 'bg-yellow-500' },
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
              <p className="text-sm font-medium text-gray-600">Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{stats.invoices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <span className="text-2xl">📄</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Contracts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.contracts}</p>
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

