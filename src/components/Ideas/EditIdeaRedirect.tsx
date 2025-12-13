import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { WorkspacesService } from '../../services/api/workspaces';

/**
 * EditIdeaRedirect Component
 * 
 * This component handles redirecting users to the ideahubORM workspace service
 * when they want to edit an existing idea.
 * 
 * Flow:
 * 1. User clicks "Edit" on an idea → navigates to /ideas/:ideaId/edit
 * 2. This component fetches the workspace ID for the idea
 * 3. Redirects user to the ideahubORM workspace at port 3000
 */

const WORKSPACE_SERVICE_URL = 'http://localhost:3000';

export const EditIdeaRedirect: React.FC = () => {
  const navigate = useNavigate();
  const { ideaId } = useParams<{ ideaId: string }>();
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/ideas/${ideaId}/edit` } });
      return;
    }

    if (!ideaId) {
      setError('No idea ID provided');
      setStatus('error');
      return;
    }

    const fetchAndRedirect = async () => {
      try {
        setStatus('loading');
        
        // Fetch the workspace for this idea
        const response = await WorkspacesService.getWorkspaceByIdeaId(ideaId);

        if (response.success && response.data) {
          const workspaceId = response.data.workspaceId;
          
          if (workspaceId) {
            setStatus('redirecting');
            // Redirect to the ideahubORM workspace service
            window.location.href = `${WORKSPACE_SERVICE_URL}/workspace/${workspaceId}`;
          } else {
            throw new Error('Workspace not found for this idea');
          }
        } else {
          throw new Error('Failed to fetch workspace');
        }
      } catch (err) {
        console.error('Error fetching workspace:', err);
        setError(err instanceof Error ? err.message : 'Failed to load workspace');
        setStatus('error');
      }
    };

    fetchAndRedirect();
  }, [ideaId, isAuthenticated, navigate]);

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
            Failed to Load Workspace
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
          {status === 'loading' ? 'Loading workspace...' : 'Redirecting to editor...'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {status === 'loading' 
            ? 'Fetching your idea workspace' 
            : 'Taking you to the workspace editor'}
        </p>
      </div>
    </div>
  );
};

export default EditIdeaRedirect;
