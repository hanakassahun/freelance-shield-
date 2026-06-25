import { useState } from 'react';
import axios from 'axios';

export default function ContractGenerator() {
  const [formData, setFormData] = useState({
    projectType: '',
    pricingModel: '',
    paymentSchedule: '',
    revisionLimit: 2,
    clientName: '',
    projectDescription: ''
  });

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/contracts/generate', formData);
      setContract(response.data.contract);
    } catch (err) {
      setError('Failed to generate contract. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (contract) {
      navigator.clipboard.writeText(contract);
      alert('Contract copied to clipboard!');
    }
  };

  const handleDownload = () => {
    if (contract) {
      const blob = new Blob([contract], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await axios.post(
        '/api/contracts/generate-pdf',
        { contract },
        {
          responseType: 'blob'
        }
      );

      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to download PDF. Please try again.');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Contract Generator</h2>
        <p className="mt-2 text-gray-600">
          Generate professional service agreements tailored to your project needs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Type
              </label>
              <select
                required
                value={formData.projectType}
                onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select project type</option>
                <option value="design">Design</option>
                <option value="development">Development</option>
                <option value="writing">Writing</option>
                <option value="consulting">Consulting</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pricing Model
              </label>
              <select
                required
                value={formData.pricingModel}
                onChange={(e) => setFormData({ ...formData, pricingModel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select pricing model</option>
                <option value="fixed">Fixed Price</option>
                <option value="hourly">Hourly Rate</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Schedule
              </label>
              <select
                required
                value={formData.paymentSchedule}
                onChange={(e) => setFormData({ ...formData, paymentSchedule: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select payment schedule</option>
                <option value="upfront">Upfront (100%)</option>
                <option value="milestones">Milestones (50/50)</option>
                <option value="on-delivery">On Delivery</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Revision Limit
              </label>
              <input
                type="number"
                min="0"
                value={formData.revisionLimit}
                onChange={(e) => setFormData({ ...formData, revisionLimit: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name
              </label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="Client name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Description
              </label>
              <textarea
                value={formData.projectDescription}
                onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                placeholder="Brief description of the project"
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Contract'}
            </button>
          </form>
        </div>

        {/* Contract Output */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Generated Contract</h3>
            {contract && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Copy
                </button>
                <button
                  onClick={handleDownload}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Download TXT
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                >
                  Download PDF
                </button>
              </div>
            )}
          </div>

          {contract ? (
            <div className="bg-gray-50 rounded p-4 border border-gray-200">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                {contract}
              </pre>
            </div>
          ) : (
            <div className="bg-gray-50 rounded p-8 border border-gray-200 text-center text-gray-500">
              Your generated contract will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

