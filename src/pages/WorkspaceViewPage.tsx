import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WorkspaceIframe } from '../components/Workspace/WorkspaceIframe';
import { useAuth } from '../contexts/AuthContext';

export const WorkspaceViewPage: React.FC = () => {
  const { username, ideaId } = useParams<{ username: string; ideaId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<any>(null);
  const [ideaData, setIdeaData] = useState<any>(null);
  const [workspaceData, setWorkspaceData] = useState<any>(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        
        const token = localStorage.getItem('auth_token');
        
        // Fetch idea and permission data
        const response = await fetch(`/.netlify/functions/workspace-permissions?ideaId=${ideaId}`, {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch workspace permissions');
        }

        const result = await response.json();
        const data = result.data;
        
        // Check if user can view
        if (!data.permissions.canView) {
          setError('You do not have permission to view this workspace');
          return;
        }

        setIdeaData(data.idea);
        setWorkspaceData(data.workspace);
        setPermissions(data.permissions);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (ideaId) {
      fetchPermissions();
    }
  }, [ideaId, user]);

  const handleFork = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      // Call fork API
      const response = await fetch('/.netlify/functions/ideas-fork', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ ideaId }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fork idea');
      }
      
      const data = result.data;
      
      // Navigate to forked workspace
      navigate(`/${user?.username}/idea/workspace/${data.id}`);
    } catch (error: any) {
      console.error('Fork failed:', error);
      alert(`Fork failed: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!ideaData || !workspaceData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Workspace not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const mode = permissions?.canEdit ? 'edit' : 'view';
  const canFork = !permissions?.isOwner && !permissions?.isCollaborator && ideaData?.visibility === 'PUBLIC';

  return (
    <div className="h-screen flex flex-col">
      {/* Workspace header */}
      <div className="bg-white dark:bg-gray-800 border-b px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{ideaData?.title}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            by {username}
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
        >
          Close
        </button>
      </div>

      {/* Workspace iframe */}
      <div className="flex-1">
        <WorkspaceIframe
          workspaceId={workspaceData.id}
          ideaId={ideaId!}
          mode={mode}
          canFork={canFork}
          onFork={handleFork}
        />
      </div>
    </div>
  );
};
