import { useState, useEffect } from 'react';
import axios from 'axios';

export default function TimeTracking() {
  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [summary, setSummary] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [timerStart, setTimerStart] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [formData, setFormData] = useState({
    projectId: '',
    date: new Date().toISOString().split('T')[0],
    hours: '',
    description: '',
    billable: true
  });

  useEffect(() => {
    fetchEntries();
    fetchProjects();
    fetchSummary();
  }, []);

  useEffect(() => {
    let interval = null;
    if (isRunning && timerStart) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - timerStart) / 1000);
        setElapsed(elapsedSeconds);
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [isRunning, timerStart]);

  const fetchEntries = async () => {
    try {
      const response = await axios.get('/api/time-tracking');
      setEntries(response.data);
    } catch (error) {
      console.error('Error fetching entries:', error);
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

  const fetchSummary = async () => {
    try {
      const response = await axios.get('/api/time-tracking/summary/stats');
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleStartTimer = () => {
    if (!formData.projectId) {
      alert('Please select a project first');
      return;
    }
    setIsRunning(true);
    setTimerStart(Date.now());
    setCurrentProject(formData.projectId);
  };

  const handleStopTimer = async () => {
    if (!isRunning) return;
    
    const hours = (elapsed / 3600).toFixed(2);
    setIsRunning(false);
    setTimerStart(null);
    
    try {
      await axios.post('/api/time-tracking', {
        projectId: currentProject,
        date: formData.date,
        hours: parseFloat(hours),
        description: formData.description || 'Timer entry',
        billable: formData.billable
      });
      fetchEntries();
      fetchSummary();
      setElapsed(0);
    } catch (error) {
      console.error('Error saving time entry:', error);
      alert('Failed to save time entry');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/time-tracking', formData);
      setShowForm(false);
      setFormData({ projectId: '', date: new Date().toISOString().split('T')[0], hours: '', description: '', billable: true });
      fetchEntries();
      fetchSummary();
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry');
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Time Tracking</h2>
        <p className="mt-2 text-gray-600">
          Track time spent on projects with a timer or manual entries.
        </p>
      </div>

      {/* Timer */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Timer</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={isRunning}
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
          <div className="text-4xl font-mono font-bold">
            {formatTime(elapsed)}
          </div>
          <div className="flex gap-2">
            {!isRunning ? (
              <button
                onClick={handleStartTimer}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Start
              </button>
            ) : (
              <button
                onClick={handleStopTimer}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
              >
                Stop
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Total Hours</div>
            <div className="text-2xl font-bold text-gray-900">{summary.totalHours.toFixed(1)}h</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Billable Hours</div>
            <div className="text-2xl font-bold text-green-600">{summary.billableHours.toFixed(1)}h</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Non-Billable</div>
            <div className="text-2xl font-bold text-gray-500">{summary.nonBillableHours.toFixed(1)}h</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Entries</div>
            <div className="text-2xl font-bold text-gray-900">{summary.entryCount}</div>
          </div>
        </div>
      )}

      {/* Manual Entry Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Manual Entry</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-blue-600 hover:text-blue-700"
          >
            {showForm ? 'Hide' : 'Add Entry'}
          </button>
        </div>
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project *</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hours *</label>
                <input
                  type="number"
                  step="0.25"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Billable</label>
                <label className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    checked={formData.billable}
                    onChange={(e) => setFormData({ ...formData, billable: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Mark as billable</span>
                </label>
              </div>
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
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add Entry
            </button>
          </form>
        )}
      </div>

      {/* Time Entries List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Recent Entries</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Billable</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.project_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.hours}h
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {entry.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {entry.billable ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Yes</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {entries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No time entries yet. Start tracking your time!</p>
          </div>
        )}
      </div>
    </div>
  );
}

