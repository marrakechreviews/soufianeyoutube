'use client';

import React, 'useState', useEffect } from 'react';
import axios from 'axios';

interface Template {
  _id: string;
  name: string;
  description: string;
  tags: string;
}

const TemplatesPage = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '', tags: '' });
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const authToken = localStorage.getItem('token');
    setToken(authToken);

    const fetchTemplates = async () => {
      if (!authToken) return;
      try {
        const res = await axios.get('/api/templates', {
          headers: { 'x-auth-token': authToken },
        });
        setTemplates(res.data);
      } catch (err) {
        console.error('Error fetching templates:', err);
      }
    };
    fetchTemplates();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTemplate((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await axios.post('/api/templates', newTemplate, {
        headers: { 'x-auth-token': token },
      });
      setTemplates((prev) => [...prev, res.data]);
      setNewTemplate({ name: '', description: '', tags: '' });
    } catch (err) {
      console.error('Error creating template:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Metadata Templates</h1>

        {/* Form for creating a new template */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Template</h2>
          <form onSubmit={handleCreateTemplate} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Template Name</label>
              <input
                type="text"
                name="name"
                id="name"
                value={newTemplate.name}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Default Description</label>
              <textarea
                name="description"
                id="description"
                value={newTemplate.description}
                onChange={handleInputChange}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Default Tags (comma-separated)</label>
              <input
                type="text"
                name="tags"
                id="tags"
                value={newTemplate.tags}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div className="text-right">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Create Template
              </button>
            </div>
          </form>
        </div>

        {/* List of existing templates */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Your Templates</h2>
          <ul className="space-y-4">
            {templates.map((template) => (
              <li key={template._id} className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold">{template.name}</h3>
                <p className="text-sm text-gray-600 truncate mt-1">{template.description}</p>
                <p className="text-xs text-gray-500 mt-2"><b>Tags:</b> {template.tags}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TemplatesPage;
