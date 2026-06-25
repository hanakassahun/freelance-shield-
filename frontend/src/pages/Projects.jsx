import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({
    clientId: '',
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: '',
    status: 'planning',
    projectType: 'other'
  });

  useEffect(() => {
    fetchProjects();
    fetchClients();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
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
      if (selectedProject) {
        await axios.patch(`/api/projects/${selectedProject.id}`, formData);
      } else {
        await axios.post('/api/projects', formData);
      }
      setShowForm(false);
      setSelectedProject(null);
      setFormData({ clientId: '', name: '', description: '', startDate: '', endDate: '', budget: '', status: 'planning', projectType: 'other' });
      fetchProjects();
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project');
    }
  };

  const handleEdit = (project) => {
    setSelectedProject(project);
    setFormData({
      clientId: project.client_id,
      name: project.name,
      description: project.description || '',
      startDate: project.start_date ? project.start_date.split('T')[0] : '',
      endDate: project.end_date ? project.end_date.split('T')[0] : '',
      budget: project.budget || '',
      status: project.status,
      projectType: project.project_type || 'other'
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await axios.delete(`/api/projects/${id}`);
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      planning: 'bg-gray-100 text-gray-800',
      active: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      on_hold: 'bg-orange-100 text-orange-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.planning;
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Projects</h2>
          <p className="mt-2 text-gray-600">
            Manage your projects, track milestones, and monitor progress.
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setSelectedProject(null);
            setFormData({ clientId: '', name: '', description: '', startDate: '', endDate: '', budget: '', status: 'planning', projectType: 'other' });
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + New Project
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">{selectedProject ? 'Edit' : 'New'} Project</h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows="3"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="in_progress">In Progress</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={formData.projectType}
                  onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="design">Design</option>
                  <option value="development">Development</option>
                  <option value="writing">Writing</option>
                  <option value="consulting">Consulting</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                {selectedProject ? 'Update' : 'Create'} Project
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedProject(null);
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                <p className="text-sm text-gray-600">{project.client_name}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-gray-700 mb-4 line-clamp-2">{project.description}</p>
            <div className="space-y-2 mb-4 text-sm">
              {project.start_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Start:</span>
                  <span className="text-gray-900">{new Date(project.start_date).toLocaleDateString()}</span>
                </div>
              )}
              {project.end_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">End:</span>
                  <span className="text-gray-900">{new Date(project.end_date).toLocaleDateString()}</span>
                </div>
              )}
              {project.budget > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Budget:</span>
                  <span className="text-gray-900">${project.budget}</span>
                </div>
              )}
              {project.totalHours > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Hours:</span>
                  <span className="text-gray-900">{project.totalHours.toFixed(1)}h</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Link
                to={`/projects/${project.id}`}
                className="flex-1 text-center bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
              >
                View Details
              </Link>
              <button
                onClick={() => handleEdit(project)}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(project.id)}
                className="px-3 py-2 bg-red-200 text-red-700 rounded-lg hover:bg-red-300 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">No projects yet. Create your first project to get started.</p>
        </div>
      )}
    </div>
  );
}

