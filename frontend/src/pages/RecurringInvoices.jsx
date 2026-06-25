import { useState, useEffect } from 'react';
import axios from 'axios';

export default function RecurringInvoices() {
  const [recurring, setRecurring] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    amount: '',
    currency: 'USD',
    frequency: 'monthly',
    startDate: '',
    endDate: '',
    description: '',
    autoGenerate: true
  });

  useEffect(() => {
    fetchRecurring();
    fetchClients();
  }, []);

  const fetchRecurring = async () => {
    try {
      const response = await axios.get('/api/recurring-invoices');
      setRecurring(response.data);
    } catch (error) {
      console.error('Error fetching recurring invoices:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get('/api/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/recurring-invoices', formData);
      setShowForm(false);
      setFormData({ clientId: '', amount: '', currency: 'USD', frequency: 'monthly', startDate: '', endDate: '', description: '', autoGenerate: true });
      fetchRecurring();
    } catch (error) {
      console.error('Error saving recurring invoice:', error);
      alert('Failed to save recurring invoice');
    }
  };

  const handleGenerate = async (id) => {
    try {
      const response = await axios.post(`/api/recurring-invoices/${id}/generate`);
      alert(`Invoice generated: ${response.data.invoice_number}`);
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Failed to generate invoice');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await axios.patch(`/api/recurring-invoices/${id}`, {
        status: currentStatus === 'active' ? 'paused' : 'active'
      });
      fetchRecurring();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this recurring invoice?')) return;
    try {
      await axios.delete(`/api/recurring-invoices/${id}`);
      fetchRecurring();
    } catch (error) {
      console.error('Error deleting recurring invoice:', error);
      alert('Failed to delete recurring invoice');
    }
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Recurring Invoices</h2>
          <p className="mt-2 text-gray-600">
            Set up recurring invoices for retainer clients and subscriptions.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + New Recurring Invoice
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Create Recurring Invoice</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client *</label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency *</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows="2"
              />
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.autoGenerate}
                  onChange={(e) => setFormData({ ...formData, autoGenerate: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Auto-generate invoices</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Recurring Invoice
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recurring.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{item.client_name}</h3>
                <p className="text-sm text-gray-600">{item.frequency}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {item.status}
              </span>
            </div>
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="text-gray-900 font-medium">
                  {item.currency} ${parseFloat(item.amount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Start:</span>
                <span className="text-gray-900">{new Date(item.start_date).toLocaleDateString()}</span>
              </div>
              {item.end_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">End:</span>
                  <span className="text-gray-900">{new Date(item.end_date).toLocaleDateString()}</span>
                </div>
              )}
              {item.description && (
                <p className="text-gray-700 text-xs">{item.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleGenerate(item.id)}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
              >
                Generate Invoice
              </button>
              <button
                onClick={() => handleToggleStatus(item.id, item.status)}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
              >
                {item.status === 'active' ? 'Pause' : 'Activate'}
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="px-3 py-2 bg-red-200 text-red-700 rounded-lg hover:bg-red-300 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {recurring.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">No recurring invoices yet. Create your first recurring invoice to get started.</p>
        </div>
      )}
    </div>
  );
}

