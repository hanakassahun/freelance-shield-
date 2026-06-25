import { useState, useEffect } from 'react';
import axios from 'axios';

export default function PaymentAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [clientHealth, setClientHealth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAnalytics();
    fetchClientHealth();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams(dateRange);
      const response = await axios.get(`/api/analytics/payments?${params}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientHealth = async () => {
    try {
      const response = await axios.get('/api/analytics/client-health');
      setClientHealth(response.data);
    } catch (error) {
      console.error('Error fetching client health:', error);
    }
  };

  const getHealthColor = (level) => {
    if (level === 'good') return 'text-green-600 bg-green-100';
    if (level === 'fair') return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return <div className="text-center py-12">Loading analytics...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Payment Analytics</h2>
        <p className="mt-2 text-gray-600">
          Track payment patterns, revenue trends, and client payment behavior.
        </p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      {analytics && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${analytics.totalRevenue.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <span className="text-2xl">⏳</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${analytics.pendingAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overdue Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${analytics.overdueAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Paid Invoices</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.paidCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Client Payment Patterns */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Payment Patterns</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Paid</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoices</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Days to Pay</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.clientPayments.map((client) => (
                    <tr key={client.clientId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {client.clientName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${client.totalPaid.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {client.invoiceCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full ${
                          client.averageDaysToPay <= 0 
                            ? 'bg-green-100 text-green-800' 
                            : client.averageDaysToPay <= 7
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {client.averageDaysToPay > 0 ? `+${client.averageDaysToPay}` : client.averageDaysToPay} days
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Revenue Trend */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
            <div className="space-y-3">
              {analytics.monthlyRevenue.map((month) => (
                <div key={month.month} className="flex items-center">
                  <div className="w-32 text-sm font-medium text-gray-700">{month.month}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 mr-4 relative">
                    <div
                      className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${(month.revenue / analytics.totalRevenue) * 100}%` }}
                    >
                      <span className="text-xs text-white font-medium">
                        ${month.revenue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="w-20 text-sm text-gray-600 text-right">{month.count} invoices</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Client Health Scores */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Relationship Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientHealth.map((client) => (
            <div key={client.clientId} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{client.clientName}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(client.healthLevel)}`}>
                  {client.healthLevel.toUpperCase()}
                </span>
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Health Score</span>
                  <span className="font-medium">{client.healthScore}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      client.healthScore >= 70 ? 'bg-green-600' :
                      client.healthScore >= 40 ? 'bg-yellow-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${client.healthScore}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-3">
                <div>Paid: {client.paidInvoices}</div>
                <div>Overdue: {client.overdueInvoices}</div>
                <div>Active Projects: {client.activeProjects}</div>
                <div>Recent Comms: {client.recentCommunications}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

