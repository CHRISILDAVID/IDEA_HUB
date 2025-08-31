import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Share2, Settings } from 'lucide-react';
import { EraserWorkspace } from '../components/Workspace/EraserWorkspace';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export const WorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (id && id !== 'new') {
      loadWorkspace();
    } else {
      setLoading(false);
    }
  }, [id, isAuthenticated]);

  const loadWorkspace = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await api.getWorkspace(id);
      setWorkspace(response.data);
    } catch (err) {
      setError('Failed to load workspace');
      console.error('Error loading workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (elements: any[], appState: any) => {
    try {
      if (id === 'new') {
        const response = await api.createWorkspace({
          name: 'Untitled Workspace',
          content: { elements, appState },
          isPublic: false,
        });
        navigate(`/workspace/${response.data.id}`, { replace: true });
      } else if (workspace) {
        await api.updateWorkspace(workspace.id, {
          content: { elements, appState },
        });
      }
    } catch (err) {
      console.error('Error saving workspace:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please sign in to access workspaces.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isOwner = workspace?.userId === user?.id;
  const canEdit = isOwner || workspace?.collaborators?.some((c: any) => 
    c.userId === user?.id && c.role === 'editor'
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Top navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {workspace?.name || 'New Workspace'}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {workspace ? (isOwner ? 'Owner' : 'Collaborator') : 'Creating new workspace...'}
              </p>
            </div>
          </div>

          {workspace && (
            <div className="flex items-center space-x-2">
              {workspace.collaborators && workspace.collaborators.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {workspace.collaborators.length}
                  </span>
                </div>
              )}
              
              {isOwner && (
                <>
                  <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                  
                  <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Workspace content */}
      <div className="flex-1">
        <EraserWorkspace
          workspaceId={id}
          onSave={handleSave}
          readOnly={!canEdit}
          className="h-full"
        />
      </div>
    </div>
  );
};