import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Idea } from '../types';
import { Layout } from '../components/Layout/Layout';

interface CreateIdeaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string; tags: string[]; category: string; visibility: 'PUBLIC' | 'PRIVATE' }) => void;
  isSubmitting: boolean;
}

const CreateIdeaDialog: React.FC<CreateIdeaDialogProps> = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(Boolean);
    onSubmit({ title, description, tags, category, visibility });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Create New Idea</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter idea title"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Describe your idea"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select category</option>
              <option value="Web Development">Web Development</option>
              <option value="Mobile Development">Mobile Development</option>
              <option value="AI/ML">AI/ML</option>
              <option value="Data Science">Data Science</option>
              <option value="DevOps">DevOps</option>
              <option value="Design">Design</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., react, nodejs, api"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Visibility
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  value="PUBLIC"
                  checked={visibility === 'PUBLIC'}
                  onChange={(e) => setVisibility(e.target.value as 'PUBLIC')}
                  className="mr-2"
                />
                Public
              </label>
              <label className="flex items-center text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  value="PRIVATE"
                  checked={visibility === 'PRIVATE'}
                  onChange={(e) => setVisibility(e.target.value as 'PRIVATE')}
                  className="mr-2"
                />
                Private
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {visibility === 'PUBLIC' 
                ? 'Anyone can view. Non-collaborators can fork to edit.' 
                : 'Only you and collaborators can access.'}
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create & Open Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const IdeaWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workspaceUrl, setWorkspaceUrl] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const initializePage = async () => {
      if (id && id !== 'new') {
        // Editing existing idea
        await loadIdea(id);
      } else {
        // Creating new idea
        setShowCreateDialog(true);
      }
    };

    initializePage();
  }, [id]);

  const loadIdea = async (ideaId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getIdea(ideaId);
      
      if (response.success && response.data) {
        setIdea(response.data);
        
        // Check if user can edit
        const isOwner = response.data.author.id === user?.id;
        const isCollaborator = response.data.collaborators?.some(
          (c: any) => c.userId === user?.id && (c.role === 'EDITOR' || c.role === 'OWNER')
        );
        const isPublicViewOnly = response.data.visibility === 'public' && !isOwner && !isCollaborator;
        
        setCanEdit(isOwner || isCollaborator || false);
        
        // If public and user wants to edit but isn't collaborator, they need to fork
        if (isPublicViewOnly && user) {
          // User can view but if they try to edit, we'll handle forking
          console.log('Public idea - view only mode for non-collaborators');
        }
        
        // Get the workspace for this idea
        const workspaceResponse = await api.getWorkspaceByIdeaId(ideaId);
        if (workspaceResponse.success && workspaceResponse.data) {
          // Construct the workspace URL for the embedded workspace editor
          // This assumes the workspace service runs on a different port or subdomain
          const workspaceServiceUrl = process.env.REACT_APP_WORKSPACE_SERVICE_URL || 'http://localhost:3001';
          setWorkspaceUrl(`${workspaceServiceUrl}/workspace/${workspaceResponse.data.id}?readonly=${!canEdit}`);
        }
      }
    } catch (err) {
      setError('Failed to load idea');
      console.error('Error loading idea:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIdea = async (data: {
    title: string;
    description: string;
    tags: string[];
    category: string;
    visibility: 'PUBLIC' | 'PRIVATE';
  }) => {
    try {
      setIsSubmitting(true);
      const response = await api.createIdea({
        title: data.title,
        description: data.description,
        content: '', // Initial empty content
        tags: data.tags,
        category: data.category,
        visibility: data.visibility.toLowerCase() as 'public' | 'private',
        status: 'draft',
      });

      if (response.success && response.data) {
        setShowCreateDialog(false);
        setIdea(response.data);
        setCanEdit(true);
        
        // Get the workspace that was created with the idea
        const workspaceResponse = await api.getWorkspaceByIdeaId(response.data.id);
        if (workspaceResponse.success && workspaceResponse.data) {
          const workspaceServiceUrl = process.env.REACT_APP_WORKSPACE_SERVICE_URL || 'http://localhost:3001';
          setWorkspaceUrl(`${workspaceServiceUrl}/workspace/${workspaceResponse.data.id}`);
        }
        
        // Update URL to reflect the new idea ID
        navigate(`/ideas/${response.data.id}`, { replace: true });
      }
    } catch (err) {
      setError('Failed to create idea');
      console.error('Error creating idea:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForkIdea = async () => {
    if (!idea || !user) return;
    
    try {
      setLoading(true);
      const response = await api.forkIdea(idea.id);
      
      if (response.success && response.data) {
        // Navigate to the forked idea's workspace
        navigate(`/ideas/${response.data.id}`);
      }
    } catch (err) {
      setError('Failed to fork idea');
      console.error('Error forking idea:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-red-600 dark:text-red-400">{error}</div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <CreateIdeaDialog
        isOpen={showCreateDialog}
        onClose={() => {
          setShowCreateDialog(false);
          navigate('/dashboard');
        }}
        onSubmit={handleCreateIdea}
        isSubmitting={isSubmitting}
      />

      {workspaceUrl && (
        <div className="h-screen w-full">
          {!canEdit && idea?.visibility === 'public' && (
            <div className="bg-yellow-100 dark:bg-yellow-900 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2 flex items-center justify-between">
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                This is a public idea. You are viewing in read-only mode.
              </div>
              <button
                onClick={handleForkIdea}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Fork to Edit
              </button>
            </div>
          )}
          <iframe
            src={workspaceUrl}
            className="w-full h-full border-0"
            title="Workspace Editor"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        </div>
      )}
    </>
  );
};
