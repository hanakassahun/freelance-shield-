import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Onboarding() {
  const [checklists, setChecklists] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [formData, setFormData] = useState({
    clientId: '',
    projectId: '',
    name: ''
  });

  useEffect(() => {
    fetchChecklists();
    fetchClients();
    fetchProjects();
  }, []);

  const fetchChecklists = async () => {
    try {
      const response = await axios.get('/api/onboarding');
      setChecklists(response.data);
    } catch (error) {
      console.error('Error fetching checklists:', error);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/onboarding', formData);
      // Add default items
      const checklistId = response.data.id;
      const defaultItems = [
        'Contract signed',
        'Deposit received',
        'Project access granted',
        'Initial meeting scheduled',
        'Project brief reviewed'
      ];
      
      for (const title of defaultItems) {
        await axios.post(`/api/onboarding/${checklistId}/items`, { title });
      }
      
      setShowForm(false);
      setFormData({ clientId: '', projectId: '', name: '' });
      fetchChecklists();
    } catch (error) {
      console.error('Error saving checklist:', error);
      alert('Failed to save checklist');
    }
  };

  const handleToggleItem = async (checklistId, itemId, completed) => {
    try {
      await axios.patch(`/api/onboarding/items/${itemId}`, { completed: !completed });
      fetchChecklists();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleAddItem = async (checklistId, title) => {
    if (!title.trim()) return;
    try {
      await axios.post(`/api/onboarding/${checklistId}/items`, { title });
      fetchChecklists();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this checklist?')) return;
    try {
      await axios.delete(`/api/onboarding/${id}`);
      fetchChecklists();
    } catch (error) {
      console.error('Error deleting checklist:', error);
      alert('Failed to delete checklist');
    }
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Onboarding Checklists</h2>
          <p className="mt-2 text-gray-600">
            Create checklists to ensure all steps are completed before starting work.
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setSelectedChecklist(null);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + New Checklist
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Create Onboarding Checklist</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Checklist Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Project Kickoff"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Checklist
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {checklists.map((checklist) => {
          const completedCount = checklist.items.filter(item => item.completed).length;
          const totalCount = checklist.items.length;
          const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

          return (
            <div key={checklist.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{checklist.name}</h3>
                  <p className="text-sm text-gray-600">
                    {checklist.client_name} {checklist.project_name && `• ${checklist.project_name}`}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(checklist.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{completedCount}/{totalCount}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {checklist.items.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleItem(checklist.id, item.id, item.completed)}
                      className="mr-3"
                    />
                    <span className={item.completed ? 'line-through text-gray-500' : 'text-gray-900'}>
                      {item.title}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add new item..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddItem(checklist.id, e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {checklists.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">No checklists yet. Create your first onboarding checklist to get started.</p>
        </div>
      )}
    </div>
  );
}

