import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { IdeasService } from '../../services/api/ideas';
import { getWorkspaceUrl } from '../../lib/service-registry';

/**
 * CreateIdeaRedirect Component
 * 
 * This component handles the creation of a new idea and redirects the user
 * to the ideahubORM workspace service for editing.
 * 
 * Flow:
 * 1. User clicks "Create" button → navigates to /ideas/new
 * 2. This component creates a new idea with workspace atomically
 * 3. Redirects user to the workspace service (auto-detected URL via service registry)
 */

export const CreateIdeaRedirect: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<'creating' | 'redirecting' | 'error'>('creating');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/ideas/new' } });
      return;
    }

    const createAndRedirect = async () => {
      try {
        setStatus('creating');
        
        // Create a new idea with default values
        // The workspace is created atomically with the idea
        const response = await IdeasService.createIdea({
          title: 'Untitled Idea',
          description: 'A new idea',
          content: '',
          category: 'other',
          tags: [],
          visibility: 'private', // Start as private until user publishes
          status: 'draft',
        });

        if (response.success && response.data) {
          const workspaceId = response.data.workspaceId;
          
          if (workspaceId) {
            setStatus('redirecting');
            // Get workspace URL from service registry (auto-detects environment)
            const workspaceBaseUrl = await getWorkspaceUrl();
            window.location.href = `${workspaceBaseUrl}/workspace/${workspaceId}`;
          } else {
            throw new Error('Workspace ID not returned from API');
          }
        } else {
          throw new Error('Failed to create idea');
        }
      } catch (err) {
        console.error('Error creating idea:', err);
        setError(err instanceof Error ? err.message : 'Failed to create idea');
        setStatus('error');
      }
    };

    createAndRedirect();
  }, [isAuthenticated, navigate]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Create Idea
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error || 'An unexpected error occurred'}
          </p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8">
        <div className="w-16 h-16 mx-auto mb-4 relative">
          <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-900"></div>
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {status === 'creating' ? 'Creating your workspace...' : 'Redirecting to editor...'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {status === 'creating' 
            ? 'Setting up your idea workspace' 
            : 'Taking you to the workspace editor'}
        </p>
      </div>
    </div>
  );
};

export default CreateIdeaRedirect;
