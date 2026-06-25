import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Communications() {
  const [communications, setCommunications] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    clientId: '',
    projectId: '',
    type: 'email',
    subject: '',
    content: '',
    direction: 'incoming',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchCommunications();
    fetchClients();
    fetchProjects();
  }, []);

  const fetchCommunications = async () => {
    try {
      const response = await axios.get('/api/communications');
      setCommunications(response.data);
    } catch (error) {
      console.error('Error fetching communications:', error);
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

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchCommunications();
      return;
    }
    try {
      const response = await axios.get(`/api/communications/search?q=${encodeURIComponent(searchQuery)}`);
      setCommunications(response.data);
    } catch (error) {
      console.error('Error searching communications:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/communications', formData);
      setShowForm(false);
      setFormData({ clientId: '', projectId: '', type: 'email', subject: '', content: '', direction: 'incoming', date: new Date().toISOString().split('T')[0] });
      fetchCommunications();
    } catch (error) {
      console.error('Error saving communication:', error);
      alert('Failed to save communication');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this communication?')) return;
    try {
      await axios.delete(`/api/communications/${id}`);
      fetchCommunications();
    } catch (error) {
      console.error('Error deleting communication:', error);
      alert('Failed to delete communication');
    }
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Communications</h2>
          <p className="mt-2 text-gray-600">
            Log and search all client communications for reference.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Log Communication
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search communications..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={handleSearch}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Search
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Log Communication</h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">None</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="meeting">Meeting</option>
                  <option value="message">Message</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Direction *</label>
                <select
                  value={formData.direction}
                  onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="incoming">Incoming</option>
                  <option value="outgoing">Outgoing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows="5"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Save Communication
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

      <div className="space-y-4">
        {communications.map((comm) => (
          <div key={comm.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    comm.direction === 'incoming' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {comm.direction}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                    {comm.type}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900">{comm.subject || 'No Subject'}</h3>
                <p className="text-sm text-gray-600">
                  {comm.client_name} {comm.project_name && `• ${comm.project_name}`}
                </p>
              </div>
              <div className="text-right text-sm text-gray-500">
                {new Date(comm.date).toLocaleDateString()}
              </div>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{comm.content}</p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleDelete(comm.id)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {communications.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">No communications yet. Log your first communication to get started.</p>
        </div>
      )}
    </div>
  );
}

