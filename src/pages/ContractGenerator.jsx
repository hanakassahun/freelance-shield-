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
  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    if (!formData.projectType) {
      errors.projectType = "Project type is required";
    }

    if (!formData.pricingModel) {
      errors.pricingModel = "Pricing model is required";
    }

    if (!formData.paymentSchedule) {
      errors.paymentSchedule = "Payment schedule is required";
    }

    const name = formData.clientName.trim();

    if (!name) {
      errors.clientName = "Client name is required";
    } else if (name.length < 2) {
      errors.clientName = "Client name must be at least 2 characters";
    } else if (!/[a-zA-Z]/.test(name)) {
      errors.clientName = "Client name must contain letters";
    }

    const description = formData.projectDescription.trim();

    if (!description) {
      errors.projectDescription = "Project description is required";
    } else if (description.length < 10) {
      errors.projectDescription = "Description must be at least 10 characters";
    } else if (!/[a-zA-Z]/.test(description)) {
      errors.projectDescription = "Description must contain meaningful text";
    }

    if (
      formData.revisionLimit === '' ||
      isNaN(formData.revisionLimit) ||
      formData.revisionLimit < 0 ||
      formData.revisionLimit > 20
    ) {
      errors.revisionLimit = "Revision limit must be between 0 and 20";
    }

    return errors;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    setFormErrors(prev => ({
      ...prev,
      [field]: ''
    }));
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
    setError('');

    try {
      const cleanedData = {
        ...formData,
        clientName: formData.clientName.trim(),
        projectDescription: formData.projectDescription.trim()
      };

      const response = await axios.post('/api/contracts/generate', cleanedData);
      setContract(response.data.contract);
    } catch (err) {
      setError('Failed to generate contract. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${formErrors[field]
      ? 'border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:ring-primary-500'
    }`;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Contract Generator</h2>
        <p className="mt-2 text-gray-600">
          Generate professional service agreements tailored to your project needs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Project Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Project Type</label>
              <select
                value={formData.projectType}
                onChange={(e) => handleChange('projectType', e.target.value)}
                className={inputClass('projectType')}
              >
                <option value="">Select project type</option>
                <option value="design">Design</option>
                <option value="development">Development</option>
                <option value="writing">Writing</option>
                <option value="consulting">Consulting</option>
                <option value="other">Other</option>
              </select>
              {formErrors.projectType && (
                <p className="text-red-500 text-sm mt-1">{formErrors.projectType}</p>
              )}
            </div>

            {/* Pricing Model */}
            <div>
              <label className="block text-sm font-medium mb-2">Pricing Model</label>
              <select
                value={formData.pricingModel}
                onChange={(e) => handleChange('pricingModel', e.target.value)}
                className={inputClass('pricingModel')}
              >
                <option value="">Select pricing model</option>
                <option value="fixed">Fixed Price</option>
                <option value="hourly">Hourly Rate</option>
              </select>
              {formErrors.pricingModel && (
                <p className="text-red-500 text-sm mt-1">{formErrors.pricingModel}</p>
              )}
            </div>

            {/* Payment Schedule */}
            <div>
              <label className="block text-sm font-medium mb-2">Payment Schedule</label>
              <select
                value={formData.paymentSchedule}
                onChange={(e) => handleChange('paymentSchedule', e.target.value)}
                className={inputClass('paymentSchedule')}
              >
                <option value="">Select payment schedule</option>
                <option value="upfront">Upfront (100%)</option>
                <option value="milestones">Milestones (50/50)</option>
                <option value="on-delivery">On Delivery</option>
              </select>
              {formErrors.paymentSchedule && (
                <p className="text-red-500 text-sm mt-1">{formErrors.paymentSchedule}</p>
              )}
            </div>

            {/* Revision Limit */}
            <div>
              <label className="block text-sm font-medium mb-2">Revision Limit</label>
              <input
                type="number"
                value={formData.revisionLimit}
                min={0}
                onChange={(e) =>
                  handleChange(
                    'revisionLimit',
                    e.target.value === '' ? '' : parseInt(e.target.value)
                  )
                }
                className={inputClass('revisionLimit')}
              />
              {formErrors.revisionLimit && (
                <p className="text-red-500 text-sm mt-1">{formErrors.revisionLimit}</p>
              )}
            </div>

            {/* Client Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Client Name</label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => handleChange('clientName', e.target.value)}
                placeholder="Client name"
                className={inputClass('clientName')}
              />
              {formErrors.clientName && (
                <p className="text-red-500 text-sm mt-1">{formErrors.clientName}</p>
              )}
            </div>

            {/* Project Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Project Description</label>
              <textarea
                rows="4"
                value={formData.projectDescription}
                onChange={(e) => handleChange('projectDescription', e.target.value)}
                placeholder="Brief description of the project"
                className={inputClass('projectDescription')}
              />
              {formErrors.projectDescription && (
                <p className="text-red-500 text-sm mt-1">{formErrors.projectDescription}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Contract'}
            </button>

          </form>
        </div>

        {/* Output Section (unchanged) */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Generated Contract</h3>

          {contract ? (
            <div className="bg-gray-50 rounded p-4 border border-gray-200">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {contract}
              </pre>
            </div>
          ) : (
            <div className="bg-gray-50 rounded p-8 border text-center text-gray-500">
              Your generated contract will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
