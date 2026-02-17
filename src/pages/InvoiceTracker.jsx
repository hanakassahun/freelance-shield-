import { useState, useEffect } from 'react';
import axios from 'axios';

export default function InvoiceTracker() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [reminderText, setReminderText] = useState('');
  const [formData, setFormData] = useState({
    clientId: '',
    amount: '',
    dueDate: '',
    description: '',
    currency: 'USD'
  });
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchInvoices();
    fetchClients();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get('/api/invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
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

  const validateForm = () => {
    const errors = {};

    const amount = parseFloat(formData.amount);
    const today = new Date();
    const dueDate = new Date(formData.dueDate);

    if (!formData.clientId) {
      errors.clientId = "Client is required";
    }

    if (!formData.amount) {
      errors.amount = "Amount is required";
    } else if (isNaN(amount) || amount <= 0) {
      errors.amount = "Amount must be greater than 0";
    }

    if (!formData.dueDate) {
      errors.dueDate = "Due date is required";
    } else if (dueDate < today.setHours(0, 0, 0, 0)) {
      errors.dueDate = "Due date cannot be in the past";
    }

    if (formData.description && formData.description.trim().length < 5) {
      errors.description = "Description must be at least 5 characters";
    }

    if (!["USD", "EUR", "GBP"].includes(formData.currency)) {
      errors.currency = "Invalid currency selected";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setLoading(true);

    try {
      const cleanedData = {
        ...formData,
        amount: parseFloat(formData.amount),
        description: formData.description.trim()
      };

      await axios.post('/api/invoices', cleanedData);

      setShowForm(false);
      setFormData({
        clientId: '',
        amount: '',
        dueDate: '',
        description: '',
        currency: 'USD'
      });

      fetchInvoices();
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await axios.patch(`/api/invoices/${id}/status`, { status });
      fetchInvoices();
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
  };

  const handleGenerateReminder = async (invoice, tone = 'polite') => {
    try {
      const response = await axios.get(`/api/invoices/${invoice.id}/reminder?tone=${tone}`);
      setReminderText(response.data.reminder);
      setSelectedInvoice(invoice);
    } catch (error) {
      console.error('Error generating reminder:', error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      paid: { color: 'bg-green-100 text-green-800', label: 'Paid' },
      overdue: { color: 'bg-red-100 text-red-800', label: 'Overdue' },
      cancelled: { color: 'bg-gray-100 text-gray-800', label: 'Cancelled' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const isOverdue = (dueDate, status) => {
    if (status !== 'pending') return false;
    return new Date(dueDate) < new Date();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await axios.delete(`/api/invoices/${id}`);
        fetchInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Invoice Tracker</h2>
          <p className="mt-2 text-gray-600">
            Track invoices and generate polite payment reminders.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
        >
          {showForm ? 'Cancel' : '+ Create Invoice'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Invoice</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client *
                </label>
                <select
                  value={formData.clientId}
                  onChange={(e) => {
                    setFormData({ ...formData, clientId: e.target.value });
                    setFormErrors(prev => ({ ...prev, clientId: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${formErrors.clientId
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-primary-500'
                    }`}
                >
                  <option value="">Select client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                {formErrors.clientId && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.clientId}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => {
                    setFormData({ ...formData, amount: e.target.value });
                    setFormErrors(prev => ({ ...prev, amount: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${formErrors.amount
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-primary-500'
                    }`}
                />
                {formErrors.amount && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.amount}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => {
                    setFormData({ ...formData, dueDate: e.target.value });
                    setFormErrors(prev => ({ ...prev, dueDate: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${formErrors.dueDate
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-primary-500'
                    }`}
                />
                {formErrors.dueDate && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.dueDate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => {
                    setFormData({ ...formData, currency: e.target.value });
                    setFormErrors(prev => ({ ...prev, currency: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${formErrors.currency
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-primary-500'
                    }`}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
                {formErrors.currency && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.currency}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  setFormErrors(prev => ({ ...prev, description: '' }));
                }}
                rows="3"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${formErrors.description
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-primary-500'
                  }`}
              />
              {formErrors.description && (
                <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Invoice'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ clientId: '', amount: '', dueDate: '', description: '', currency: 'USD' });
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reminder Modal */}
      {selectedInvoice && reminderText && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Payment Reminder</h3>
              <button
                onClick={() => {
                  setSelectedInvoice(null);
                  setReminderText('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="bg-gray-50 rounded p-4 mb-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-800">{reminderText}</pre>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(reminderText);
                  alert('Reminder copied to clipboard!');
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => {
                  setSelectedInvoice(null);
                  setReminderText('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoices List */}
      <div className="space-y-4">
        {invoices.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No invoices yet. Create your first invoice to start tracking.
          </div>
        ) : (
          invoices.map((invoice) => (
            <div
              key={invoice.id}
              className={`bg-white rounded-lg shadow p-6 ${isOverdue(invoice.due_date, invoice.status) ? 'border-l-4 border-red-500' : ''
                }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Invoice #{invoice.invoice_number}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {invoice.client_name} • Due: {new Date(invoice.due_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(invoice.status)}
                  <button
                    onClick={() => handleDelete(invoice.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {invoice.currency} ${parseFloat(invoice.amount).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-1">
                    <select
                      value={invoice.status}
                      onChange={(e) => handleStatusUpdate(invoice.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Reminders</p>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => handleGenerateReminder(invoice, 'polite')}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Polite
                    </button>
                    <button
                      onClick={() => handleGenerateReminder(invoice, 'firm')}
                      className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                    >
                      Firm
                    </button>
                  </div>
                </div>
              </div>

              {invoice.description && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">{invoice.description}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

