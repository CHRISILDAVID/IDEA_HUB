import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export const IdeaWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (id && id !== 'new') {
      // Load existing idea and redirect to workspace view
      loadIdeaAndRedirect();
    } else {
      // Create new idea and redirect to workspace view
      createNewIdeaAndRedirect();
    }
  }, [id, isAuthenticated]);

  const loadIdeaAndRedirect = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await api.getIdea(id);
      const idea = response.data;
      
      // Redirect to workspace view page
      if (idea && idea.author) {
        navigate(`/${idea.author.username}/idea/workspace/${idea.id}`, { replace: true });
      }
    } catch (err) {
      setError('Failed to load idea');
      console.error('Error loading idea:', err);
      setLoading(false);
    }
  };

  const createNewIdeaAndRedirect = async () => {
    try {
      setLoading(true);
      
      // Create new idea with workspace
      const response = await api.createIdea({
        title: 'Untitled Idea',
        description: 'A new idea workspace',
        content: '',
        canvasData: JSON.stringify({ elements: [], appState: {} }),
        category: 'general',
        tags: [],
        visibility: 'public',
        status: 'published',
      });
      
      const idea = response.data;
      
      // Redirect to workspace view page
      if (idea && user) {
        navigate(`/${user.username}/idea/workspace/${idea.id}`, { replace: true });
      }
    } catch (err) {
      setError('Failed to create idea');
      console.error('Error creating idea:', err);
      setLoading(false);
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
            Please sign in to access ideas.
          </p>
        </div>
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

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600 dark:text-gray-400">
          {id === 'new' ? 'Creating workspace...' : 'Loading workspace...'}
        </p>
      </div>
    </div>
  );
};