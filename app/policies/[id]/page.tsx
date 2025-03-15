'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditPolicyPage() {
  const params = useParams();
  const policyId = params.id as string;
  
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    keywords: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  
  useEffect(() => {
    async function fetchPolicy() {
      try {
        const response = await fetch(`/api/policies/${policyId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch policy');
        }
        
        const policy = await response.json();
        
        setFormData({
          name: policy.name,
          description: policy.description,
          keywords: policy.keywords.join(', ')
        });
      } catch (err: unknown) {
        const errMessage = typeof err === 'string' ? err : err instanceof Error ? err.message : 'Unknown error';
        setError(errMessage);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPolicy();
  }, [policyId]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(policyId);
    setCopySuccess('Copied!');
    setTimeout(() => setCopySuccess(''), 2000);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const keywords = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
      
      const response = await fetch(`/api/policies/${policyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          keywords
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update policy');
      }
      
      router.push('/policies');
    } catch (error: unknown) {
      const errorMessage = typeof error === 'string' ? error : 'An error occurred';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this policy? This will also delete all associated tweets and sentiment data.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/policies/${policyId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete policy');
      }
      
      router.push('/policies');
    } catch (err: unknown) {
      const errMessage = typeof err === 'string' ? err : err instanceof Error ? err.message : 'An error occurred';
      setError(errMessage);
      // setError(err.message);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading policy data...</div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Edit Policy</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg p-6">
        {/* Policy ID Display for Testing */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">Policy ID</h3>
              <p className="text-sm text-gray-600">Use this ID when testing sentiment analysis</p>
            </div>
            <button
              onClick={copyToClipboard}
              className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-1 px-3 rounded text-sm"
            >
              {copySuccess || 'Copy ID'}
            </button>
          </div>
          <div className="mt-2 p-2 bg-gray-100 rounded font-mono text-sm break-all">
            {policyId}
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Policy Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows={4}
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="keywords">
              Keywords (comma separated)
            </label>
            <input
              type="text"
              id="keywords"
              name="keywords"
              value={formData.keywords}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="healthcare, policy, reform"
              required
            />
            <p className="text-gray-600 text-xs mt-1">
              These keywords will be used to filter tweets related to this policy
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => router.push('/policies')}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancel
              </button>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}