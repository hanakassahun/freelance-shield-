import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ClientRiskScoring() {
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    notes: '',
    riskSignals: []
  });
  const [availableSignals, setAvailableSignals] = useState({});
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchClients();
    fetchRiskSignals();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await axios.get('/api/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchRiskSignals = async () => {
    try {
      const response = await axios.get('/api/risk/signals');
      setAvailableSignals(response.data);
    } catch (error) {
      console.error('Error fetching risk signals:', error);
    }
  };

  const validateForm = () => {
    const errors = {};

    const name = formData.name.trim();
    const email = formData.email.trim();
    const notes = formData.notes.trim();

    if (!name) {
      errors.name = "Client name is required";
    } else if (name.length < 2) {
      errors.name = "Name must be at least 2 characters";
    } else if (!/[a-zA-Z]/.test(name)) {
      errors.name = "Name must contain letters";
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = "Invalid email format";
      }
    }

    if (notes && notes.length < 5) {
      errors.notes = "Notes must be at least 5 characters";
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
        name: formData.name.trim(),
        email: formData.email.trim(),
        notes: formData.notes.trim()
      };

      await axios.post('/api/clients', cleanedData);

      setShowForm(false);
      setFormData({ name: '', email: '', notes: '', riskSignals: [] });
      fetchClients();
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Failed to save client');
    } finally {
      setLoading(false);
    }
  };


  const toggleSignal = (signalType) => {
    setFormData(prev => {
      const exists = prev.riskSignals.find(s => s.type === signalType);
      if (exists) {
        return {
          ...prev,
          riskSignals: prev.riskSignals.filter(s => s.type !== signalType)
        };
      } else {
        return {
          ...prev,
          riskSignals: [...prev.riskSignals, { type: signalType }]
        };
      }
    });
  };

  const getRiskBadge = (client) => {
    const badges = {
      low: { emoji: '🟢', color: 'bg-green-100 text-green-800' },
      medium: { emoji: '🟡', color: 'bg-yellow-100 text-yellow-800' },
      high: { emoji: '🔴', color: 'bg-red-100 text-red-800' }
    };
    const badge = badges[client.risk_level] || badges.low;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <span className="mr-1">{badge.emoji}</span>
        {client.risk_level?.toUpperCase()} Risk ({client.risk_score}/100)
      </span>
    );
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await axios.delete(`/api/clients/${id}`);
        fetchClients();
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Client Risk Scoring</h2>
          <p className="mt-2 text-gray-600">
            Assess and track client risk factors before committing to projects.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
        >
          {showForm ? 'Cancel' : '+ Add Client'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Client</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setFormErrors(prev => ({ ...prev, name: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${formErrors.name
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-primary-500'
                    }`}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                )}

              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setFormErrors(prev => ({ ...prev, email: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${formErrors.email
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-primary-500'
                    }`}
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                )}

              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => {
                  setFormData({ ...formData, notes: e.target.value });
                  setFormErrors(prev => ({ ...prev, notes: '' }));
                }}
                rows="3"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${formErrors.notes
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-primary-500'
                  }`}
              />
              {formErrors.notes && (
                <p className="text-red-500 text-sm mt-1">{formErrors.notes}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Risk Signals (select all that apply)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(availableSignals).map(([key, signal]) => (
                  <label
                    key={key}
                    className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.riskSignals.some(s => s.type === key)}
                      onChange={() => toggleSignal(key)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{signal.description}</div>
                      <div className="text-xs text-gray-500">Weight: +{signal.weight}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Client'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ name: '', email: '', notes: '', riskSignals: [] });
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Clients List */}
      <div className="space-y-4">
        {clients.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No clients yet. Add your first client to start tracking risk.
          </div>
        ) : (
          clients.map((client) => (
            <div key={client.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{client.name}</h3>
                  {client.email && (
                    <p className="text-sm text-gray-600 mt-1">{client.email}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getRiskBadge(client)}
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {client.riskAssessment && client.riskAssessment.explanations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Risk Factors:</h4>
                  <ul className="space-y-1">
                    {client.riskAssessment.explanations.map((exp, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          <strong>{exp.description}</strong>
                          {exp.details && <span className="text-gray-500"> - {exp.details}</span>}
                          <span className="text-gray-400 ml-2">(+{exp.weight})</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {client.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">{client.notes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

